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
