import { verificationContext } from './verification-context.mjs';
import { access, readFile } from 'node:fs/promises';
import { chromium } from 'playwright-core';
import { loadUpdates } from './update-core.mjs';
import { renderEditorialPost, editorialExpectations } from './editorial.mjs';
import { materializedText, editorialSnapshot, assertSnapshot } from './runtime-common.mjs';

const chromeCandidates=['/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium','/usr/bin/chromium-browser'];
let executablePath='';
for(const candidate of chromeCandidates){try{await access(candidate);executablePath=candidate;break;}catch{}}
if(!executablePath)throw new Error('E_PUBLIC_VERIFY_CHROME');

const pending=[];
for(const update of await loadUpdates()){
  try{
    const state=JSON.parse(await readFile(`publishing/update-state/${update.id}.json`,'utf8'));
    if(state.phase==='submitting')pending.push({update,state});
  }catch(error){if(error?.code!=='ENOENT')throw error;}
}
if(pending.length!==1)throw new Error('E_PUBLIC_VERIFY_STATE');
const {update,state}=pending[0];
const targetHtml=renderEditorialPost(update);
const expected=editorialExpectations(update.bodyHtml);

const browser=await chromium.launch({headless:true,executablePath});
const context=await verificationContext(browser, {viewport:{width:1440,height:1000}});
try{
  const page=await context.newPage();
  const response=await page.goto(update.targetUrl,{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForTimeout(5000);
  const content=page.locator('.contents_style');
  if(response?.status()!==200||await content.count()!==1)throw new Error('E_RECOVERY_PUBLIC_CONTENT');
  const body=(await page.locator('body').innerText()).replace(/\s+/g,' ').trim();
  if(!body.includes(update.title))throw new Error('E_RECOVERY_PUBLIC_TITLE');
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
  if(desktopMetrics.overflow)throw new Error('E_RECOVERY_PUBLIC_PC_OVERFLOW');

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

  console.log('RECOVERY_PUBLIC_VERIFY_PASS');
  console.log(JSON.stringify({
    id:update.id,
    url:update.targetUrl,
    title:update.title,
    sourceCommit:state.sourceCommit,
    fingerprint:state.fingerprint,
    og,
    desktop:{snapshot:desktopSnapshot,...desktopMetrics},
    mobile:{snapshot:mobileSnapshot,...mobileMetrics}
  }));
}finally{
  await context.close();
  await browser.close();
}

// recovery trigger: public verification only
