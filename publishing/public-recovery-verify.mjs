import { access, readFile } from 'node:fs/promises';
import { chromium } from 'playwright-core';
import { loadUpdates } from './update-core.mjs';
import { renderEditorialPost, editorialExpectations } from './editorial.mjs';
import { verifyPublic } from './runtime-common.mjs';

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
try{
  const diagPage=await browser.newPage({viewport:{width:1440,height:1000}});
  try{
    const response=await diagPage.goto(update.targetUrl,{waitUntil:'domcontentloaded',timeout:45000});
    await diagPage.waitForTimeout(5000);
    const diag=await diagPage.evaluate(()=>({
      href:location.href,
      title:document.title,
      readyState:document.readyState,
      contentsStyle:document.querySelectorAll('.contents_style').length,
      articleUseless:document.querySelectorAll('.tt_article_useless_p_margin').length,
      bodyText:(document.body?.innerText||'').replace(/\s+/g,' ').trim().slice(0,600),
      htmlLength:document.documentElement?.outerHTML?.length||0
    }));
    console.log('RECOVERY_BROWSER_DIAG '+JSON.stringify({status:response?.status?.()??null,...diag}));
  }finally{await diagPage.close();}
  const desktop=await verifyPublic(browser,{url:update.targetUrl,title:update.title,targetHtml,expected,prefix:'E_RECOVERY_PUBLIC'});
  const mobile=await verifyPublic(browser,{url:update.targetUrl,title:update.title,targetHtml,expected,prefix:'E_RECOVERY_PUBLIC',mobile:true});
  console.log('RECOVERY_PUBLIC_VERIFY_PASS');
  console.log(JSON.stringify({
    id:update.id,
    url:update.targetUrl,
    title:update.title,
    sourceCommit:state.sourceCommit,
    fingerprint:state.fingerprint,
    desktop,
    mobile
  }));
}finally{await browser.close();}
