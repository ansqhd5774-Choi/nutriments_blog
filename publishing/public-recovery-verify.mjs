import { access, readFile } from 'node:fs/promises';
import { chromium } from 'playwright-core';
import { BLOG, loadPosts } from './core.mjs';
import { loadUpdates } from './update-core.mjs';
import { Ledger } from './ledger.mjs';
import { UpdateLedger } from './update-ledger.mjs';
import { renderEditorialPost, editorialExpectations } from './editorial.mjs';
import { materializedText, editorialSnapshot, assertSnapshot, remoteMainSha } from './runtime-common.mjs';
import { verificationContext } from './verification-context.mjs';

const chromeCandidates=['/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium','/usr/bin/chromium-browser'];
let executablePath='';
for(const candidate of chromeCandidates){try{await access(candidate);executablePath=candidate;break;}catch{}}
if(!executablePath)throw new Error('E_PUBLIC_VERIFY_CHROME');

const candidates=[];
for(const post of await loadPosts()){
  try{
    const state=JSON.parse(await readFile(`publishing/state/${post.id}.json`,'utf8'));
    if(state.phase==='submitting')candidates.push({kind:'publish',item:post,state});
  }catch(error){if(error?.code!=='ENOENT')throw error;}
}
for(const update of await loadUpdates()){
  try{
    const state=JSON.parse(await readFile(`publishing/update-state/${update.id}.json`,'utf8'));
    if(state.phase==='submitting')candidates.push({kind:'update',item:update,state});
  }catch(error){if(error?.code!=='ENOENT')throw error;}
}
if(candidates.length!==1)throw new Error('E_PUBLIC_VERIFY_STATE');
const {kind,item,state}=candidates[0];
const targetHtml=renderEditorialPost(item);
const expected=editorialExpectations(item.bodyHtml);

const browser=await chromium.launch({headless:true,executablePath});
const context=await verificationContext(browser,{viewport:{width:1440,height:1000}});
let url=kind==='update'?item.targetUrl:null;
try{
  const page=await context.newPage();
  if(kind==='publish'){
    const response=await page.goto(BLOG,{waitUntil:'domcontentloaded',timeout:45000});
    if(response?.status()!==200)throw new Error('E_RECOVERY_PUBLIC_INDEX');
    await page.waitForTimeout(2500);
    const urls=await page.locator('a').evaluateAll((links,title)=>[...new Set(links
      .filter(a=>(a.textContent||'').trim()===title)
      .map(a=>a.href)
      .filter(href=>/^https:\/\/nutriments\.tistory\.com\/\d+$/.test(href)))],item.title);
    if(urls.length!==1)throw new Error('E_RECOVERY_PUBLIC_URL');
    url=urls[0];
  }

  const response=await page.goto(url,{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForTimeout(5000);
  const content=page.locator('.contents_style');
  if(response?.status()!==200||await content.count()!==1)throw new Error('E_RECOVERY_PUBLIC_CONTENT');
  const body=(await page.locator('body').innerText()).replace(/\s+/g,' ').trim();
  if(!body.includes(item.title))throw new Error('E_RECOVERY_PUBLIC_TITLE');
  const actual=(await content.innerText()).replace(/\s+/g,' ').trim();
  const expectedText=await materializedText(page,targetHtml);
  if(!expectedText||actual!==expectedText)throw new Error('E_RECOVERY_PUBLIC_BODY');
  const og=await page.locator('meta[property="og:image"]').getAttribute('content').catch(()=>null);
  if(!og||og.includes('opengraph.png')||!og.includes('kakaocdn.net'))throw new Error('E_RECOVERY_PUBLIC_OG');

  const desktopSnapshot=await editorialSnapshot(content);
  assertSnapshot(desktopSnapshot,expected,'E_RECOVERY_PUBLIC');
  const desktopMetrics=await page.evaluate(()=>({
    scrollWidth:document.documentElement.scrollWidth,
    clientWidth:document.documentElement.clientWidth,
    overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth+4,
    wideImages:[...document.querySelectorAll('.contents_style img')].filter(x=>x.getBoundingClientRect().width>document.documentElement.clientWidth+4).length
  }));
  if(desktopMetrics.overflow||desktopMetrics.wideImages)throw new Error('E_RECOVERY_PUBLIC_PC_OVERFLOW');

  await page.setViewportSize({width:390,height:844});
  await page.waitForTimeout(1200);
  const mobileSnapshot=await editorialSnapshot(content);
  assertSnapshot(mobileSnapshot,expected,'E_RECOVERY_PUBLIC');
  const mobileMetrics=await page.evaluate(()=>({
    scrollWidth:document.documentElement.scrollWidth,
    clientWidth:document.documentElement.clientWidth,
    overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth+4,
    wideImages:[...document.querySelectorAll('.contents_style img')].filter(x=>x.getBoundingClientRect().width>document.documentElement.clientWidth+4).length
  }));
  if(mobileMetrics.overflow||mobileMetrics.wideImages)throw new Error('E_RECOVERY_PUBLIC_MOBILE_OVERFLOW');

  if(remoteMainSha()!==process.env.GITHUB_SHA)throw new Error('E_RECOVERY_SOURCE_DRIFT');

  if(kind==='publish'){
    const ledger=new Ledger();
    const live=await ledger.read(item.id);
    if(live?.phase!=='submitting'||live.fingerprint!==state.fingerprint)throw new Error('E_RECOVERY_LEDGER_CONFLICT');
    await ledger.write(item.id,{
      phase:'published',
      fingerprint:state.fingerprint,
      url,
      sourceCommit:state.sourceCommit,
      editorialTemplateVersion:state.editorialTemplateVersion,
      timestamp:new Date().toISOString(),
      verification:'anonymous_full_body_editorial_pc_mobile_recovery',
      ogImage:og,
      mobile:{snapshot:mobileSnapshot,og,...mobileMetrics}
    },live.sha);
  }else{
    const ledger=new UpdateLedger();
    const live=await ledger.read(item.id);
    if(live?.phase!=='submitting'||live.fingerprint!==state.fingerprint||live.url!==item.targetUrl)throw new Error('E_RECOVERY_UPDATE_LEDGER_CONFLICT');
    await ledger.write(item.id,{
      phase:'updated',
      fingerprint:state.fingerprint,
      url:item.targetUrl,
      articleId:item.articleId,
      previousTitle:item.expectedCurrentTitle,
      title:item.title,
      sourceCommit:state.sourceCommit,
      editorialTemplateVersion:state.editorialTemplateVersion,
      timestamp:new Date().toISOString(),
      verification:'anonymous_full_body_editorial_pc_mobile_recovery',
      ogImage:og,
      mobile:{snapshot:mobileSnapshot,og,...mobileMetrics}
    },live.sha);
  }

  console.log('RECOVERY_PUBLIC_VERIFY_PASS');
  console.log(JSON.stringify({
    kind,id:item.id,url,title:item.title,sourceCommit:state.sourceCommit,fingerprint:state.fingerprint,og,
    desktop:{snapshot:desktopSnapshot,...desktopMetrics},
    mobile:{snapshot:mobileSnapshot,...mobileMetrics}
  }));
}finally{
  await context.close();
  await browser.close();
}
