import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { BLOG, loadPosts, checkPublishHtml, eligible, fingerprint, assertArticleUrl, selectOne } from './core.mjs';
import { Ledger } from './ledger.mjs';
import { localBrowserConfig, assertLocalGit, openEditorContext, openPublicBrowser } from './local-browser.mjs';
import { renderEditorialPost, editorialExpectations, assertEditorialContract, EDITORIAL_TEMPLATE_VERSION } from './editorial.mjs';
import { imageSources, uploadImage, replaceImageSources, downloadImage, assertSourceCurrent, assertRemoteMain, verifyPublic } from './runtime-common.mjs';

let editorContext,publicBrowser,tempDir,editorPage; let stage='configuration';
try{
  if(process.env.PUBLISH_ENABLED!=='true') console.log('DISABLED: publication is not enabled.');
  else{
    assertLocalGit(); const ledger=new Ledger(); const queue=[];
    for(const post of await loadPosts()){const state=await ledger.read(post.id);if(eligible(post,state))queue.push(checkPublishHtml(post));}
    const post=selectOne(queue,'E_ONE_POST_PER_RUN');
    if(!post) console.log('NO_PENDING_POSTS');
    else{
      const browserConfig=await localBrowserConfig(); editorContext=await openEditorContext(browserConfig); tempDir=await mkdtemp(join(tmpdir(),'nutriments-images-'));
      const page=await editorContext.newPage(); editorPage=page; page.setDefaultTimeout(25000);
      page.on('dialog',async d=>{if(d.type()==='confirm'&&/모드.*변경|변경.*모드/.test(d.message()))await d.accept();else await d.dismiss();});
      stage='editor-open'; await page.goto(`${BLOG}/manage/post`,{waitUntil:'domcontentloaded'}); if(new URL(page.url()).origin!==BLOG)throw new Error('E_LOGIN_REQUIRED'); await page.locator('#post-title-inp').waitFor({state:'visible'});
      stage='render'; const rendered=renderEditorialPost(post); const expected=editorialExpectations(post.bodyHtml); const sources=[...new Set(imageSources(rendered))]; const representativeSource=post.representativeImageUrl;
      const imageMap=new Map(); for(let i=0;i<sources.length;i++){stage=`image-upload-${i+1}`;imageMap.set(sources[i],await uploadImage(page,sources[i],i,tempDir));}
      const bodyHtml=replaceImageSources(rendered,imageMap,representativeSource);
      stage='stage-content'; await page.locator('#post-title-inp').fill(post.title); await page.locator('#editor-mode-layer-btn-open').click(); await page.locator('#editor-mode-html').click(); const code=page.locator('.CodeMirror:visible .CodeMirror-code');await code.waitFor({state:'visible'});await code.click();await page.keyboard.press('ControlOrMeta+A');await page.keyboard.insertText(bodyHtml);const staged=await page.locator('.CodeMirror:visible').evaluate(el=>el?.CodeMirror?.getValue?.()||'');assertEditorialContract(staged,post.bodyHtml);
      stage='category-tags'; await page.locator('#category-btn').click(); await page.locator('#category-list').waitFor({state:'visible'}); const matches=[]; for(const option of await page.locator('#category-list [role="option"]').all())if((await option.innerText()).trim().replace(/^-\s*/,'')===post.category)matches.push(option);if(matches.length!==1)throw new Error('E_CATEGORY_AMBIGUOUS');await matches[0].click();for(const tag of post.tags){await page.locator('#tagText').fill(tag);await page.locator('#tagText').press('Enter');}
      stage='publish-dialog'; await page.locator('#publish-layer-btn').click(); const thumb=page.locator('.publish_editor .box_thumb'); if(await thumb.count()!==1)throw new Error('E_REPRESENTATIVE_UNVERIFIED'); if(((await thumb.innerText().catch(()=>''))||'').includes('대표이미지 추가')){const repPath=join(tempDir,'representative.bin');await downloadImage(representativeSource,repPath);const input=thumb.locator('input[type="file"]');if(await input.count()!==1)throw new Error('E_REPRESENTATIVE_UNVERIFIED');await input.setInputFiles(repPath);await page.waitForFunction(()=>{const b=document.querySelector('.publish_editor .box_thumb');return !!b&&!((b.textContent||'').includes('대표이미지 추가'));},{timeout:10000});}
      await page.getByLabel('공개',{exact:true}).check(); const submit=page.getByRole('button',{name:'공개 발행',exact:true}); await submit.waitFor({state:'visible'}); if(await page.locator('#post-title-inp').inputValue()!==post.title)throw new Error('E_TITLE_MISMATCH');
      const sourceCommit=assertSourceCurrent(); const fp=fingerprint(post); const checkpoint=await ledger.write(post.id,{phase:'submitting',fingerprint:fp,sourceCommit,editorialTemplateVersion:EDITORIAL_TEMPLATE_VERSION,timestamp:new Date().toISOString()});
      const checkpointCommit=checkpoint?.commit?.sha; if(!checkpointCommit)throw new Error('E_CHECKPOINT_COMMIT'); assertRemoteMain(checkpointCommit,'E_CHECKPOINT_DRIFT');
      stage='final-submit'; await submit.click(); await page.waitForURL(url=>url.origin===BLOG&&/\/manage\/posts\/?$/.test(url.pathname)); await page.locator('a').filter({hasText:post.title}).first().waitFor({state:'visible'});
      const publicUrls=await page.locator('a').evaluateAll((links,title)=>[...new Set(links.filter(a=>(a.textContent||'').trim()===title).map(a=>a.href).filter(href=>/^https:\/\/nutriments\.tistory\.com\/\d+$/.test(href)))],post.title); if(publicUrls.length!==1)throw new Error('E_PUBLICATION_UNCERTAIN'); const url=assertArticleUrl(publicUrls[0]);
      stage='public-verification'; publicBrowser=await openPublicBrowser(browserConfig); const desktop=await verifyPublic(publicBrowser,{url,title:post.title,targetHtml:bodyHtml,expected,prefix:'E_PUBLIC'}); const mobile=await verifyPublic(publicBrowser,{url,title:post.title,targetHtml:bodyHtml,expected,prefix:'E_PUBLIC',mobile:true});
      const state=await ledger.read(post.id); if(state?.phase!=='submitting'||state.fingerprint!==fp)throw new Error('E_LEDGER_CONFLICT'); await ledger.write(post.id,{phase:'published',fingerprint:fp,url,sourceCommit,editorialTemplateVersion:EDITORIAL_TEMPLATE_VERSION,timestamp:new Date().toISOString(),verification:'anonymous_full_body_editorial_pc_mobile',ogImage:desktop.og,mobile},state.sha); console.log(`PUBLISHED: ${post.id} ${url}`);
    }
  }
}catch(error){const code=/^E_[A-Z_]+$/.test(error?.message??'')?error.message:'E_RUNTIME';console.error(`DIAGNOSTIC: ${stage} ${code}`);console.error('STOP: failed or uncertain publication is never retried automatically.');process.exitCode=1;}
finally{for(const r of [publicBrowser,editorContext])try{await r?.close();}catch{console.error('E_LOCAL_BROWSER_CLOSE');process.exitCode=1;}if(tempDir)try{await rm(tempDir,{recursive:true,force:true});}catch{console.error('E_LOCAL_TEMP_CLEANUP');process.exitCode=1;}}
