import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { BLOG } from './core.mjs';
import { loadUpdates } from './update-core.mjs';
import { imageSources, downloadImage } from './runtime-common.mjs';
import { localBrowserConfig, assertLocalGit, openEditorContext, openPublicBrowser } from './local-browser.mjs';

let editorContext,publicBrowser,tempDir;
try {
  assertLocalGit();
  const config=await localBrowserConfig();
  editorContext=await openEditorContext(config);
  const page=await editorContext.newPage();
  await page.goto(`${BLOG}/manage/posts`,{waitUntil:'domcontentloaded',timeout:45000});
  await page.getByRole('link',{name:'글쓰기',exact:true}).first().waitFor({state:'visible',timeout:15000});
  if(new URL(page.url()).origin!==BLOG||new URL(page.url()).pathname!=='/manage/posts') throw new Error('E_LOGIN_REQUIRED');
  await page.waitForTimeout(2500);
  tempDir=await mkdtemp(join(tmpdir(),'nutriments-smoke-'));

  const updates=await loadUpdates();
  for(const update of updates){
    const audit=await editorContext.newPage();
    try{
      await audit.goto(`${BLOG}/manage/newpost/${update.articleId}`,{waitUntil:'domcontentloaded',timeout:45000});
      if(new URL(audit.url()).origin!==BLOG) throw new Error('E_LOGIN_REQUIRED');
      await audit.locator('#post-title-inp').waitFor({state:'visible',timeout:15000});
      const currentTitle=(await audit.locator('#post-title-inp').inputValue()).trim();
      console.log(`ADMIN_CURRENT_TITLE articleId=${update.articleId} title=${currentTitle}`);
      if(currentTitle!==update.expectedCurrentTitle && currentTitle!==update.title) throw new Error('E_UPDATE_CURRENT_TITLE_MISMATCH');
    } finally { try{await audit.close();}catch{} }

    const sources=[...new Set(imageSources(update.bodyHtml))];
    for(let i=0;i<sources.length;i++){
      await downloadImage(sources[i],join(tempDir,`image-${i}.bin`));
      console.log(`IMAGE_DOWNLOAD_PASS index=${i} url=${sources[i]}`);
    }

    publicBrowser=await openPublicBrowser(config);
    for(const mobile of [false,true]){
      const context=await publicBrowser.newContext(mobile?{viewport:{width:390,height:844},userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1'}:{viewport:{width:1440,height:1000}});
      try{
        const pub=await context.newPage();
        await pub.goto(update.targetUrl,{waitUntil:'domcontentloaded',timeout:45000});
        await pub.waitForTimeout(2500);
        const evidence=await pub.evaluate(({newTitle,oldTitle,needle})=>{
          const bodyText=(document.body.innerText||'').replace(/\s+/g,' ').trim();
          const all=[...document.querySelectorAll('*')];
          const containing=all.filter(el=>(el.textContent||'').includes(needle));
          const minimal=containing.find(el=>![...el.children].some(c=>(c.textContent||'').includes(needle)))||null;
          const ancestors=[]; let n=minimal;
          for(let i=0;n&&i<8;i++,n=n.parentElement)ancestors.push({tag:n.tagName.toLowerCase(),id:n.id||'',className:typeof n.className==='string'?n.className:''});
          const candidates=['.contents_style','.tt_article_useless_p_margin','.entry-content','.article_view','.area_view','.article','.post-content','article'].map(sel=>({sel,count:document.querySelectorAll(sel).length,text:(document.querySelector(sel)?.innerText||'').replace(/\s+/g,' ').trim().slice(0,180)}));
          return {
            href:location.href,
            h1:[...document.querySelectorAll('h1')].map(x=>(x.textContent||'').trim()).filter(Boolean).slice(0,5),
            hasNewTitle:bodyText.includes(newTitle),
            hasOldTitle:bodyText.includes(oldTitle),
            hasNeedle:bodyText.includes(needle),
            ancestors,
            candidates,
            og:document.querySelector('meta[property="og:image"]')?.getAttribute('content')||null,
            images:[...document.querySelectorAll('img')].map(x=>x.src).filter(Boolean).slice(0,20),
            scrollWidth:document.documentElement.scrollWidth,
            clientWidth:document.documentElement.clientWidth,
            wideImages:[...document.querySelectorAll('img')].filter(x=>x.getBoundingClientRect().width>document.documentElement.clientWidth+4).length
          };
        },{newTitle:update.title,oldTitle:update.expectedCurrentTitle,needle:'프로바이오틱스는 영양소가 아니므로'});
        console.log(`PUBLIC_DOM_${mobile?'MOBILE':'PC'} ${JSON.stringify(evidence)}`);
      } finally { await context.close(); }
    }
  }
  console.log('RECOVERY_DIAGNOSTIC_PASS / MUTATION_NOT_ATTEMPTED');
}catch(error){
  console.error(/^E_[A-Z0-9_]+$/.test(error?.message??'')?error.message:'E_LOCAL_SMOKE');
  process.exitCode=1;
}finally{
  try{await publicBrowser?.close();}catch{process.exitCode=1;}
  try{await editorContext?.close();}catch{process.exitCode=1;}
  if(tempDir)try{await rm(tempDir,{recursive:true,force:true});}catch{process.exitCode=1;}
}
