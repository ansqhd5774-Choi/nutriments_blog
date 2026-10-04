import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { BLOG, loadPosts, checkPublishHtml, eligible, fingerprint, assertArticleUrl, selectOne } from './core.mjs';
import { Ledger } from './ledger.mjs';
import { localBrowserConfig, assertLocalGit, openEditorContext, openPublicBrowser } from './local-browser.mjs';
import { renderEditorialPost, editorialExpectations, assertEditorialContract, EDITORIAL_TEMPLATE_VERSION } from './editorial.mjs';
import { imageSources, uploadImage, replaceImageSources, downloadImage, assertSourceCurrent, assertRemoteMain, verifyPublic } from './runtime-common.mjs';

let editorContext,publicBrowser,tempDir,editorPage; let finalSubmitDialogs=[]; let stage='configuration';
try{
  if(process.env.PUBLISH_ENABLED!=='true') console.log('DISABLED: publication is not enabled.');
  else{
    assertLocalGit(); assertSourceCurrent(); const ledger=new Ledger(); const queue=[];
    for(const post of await loadPosts()){const state=await ledger.read(post.id);if(eligible(post,state))queue.push({post:checkPublishHtml(post),previousStateSha:state?.phase==='failed'?state.sha:undefined});}
    const selected=selectOne(queue,'E_ONE_POST_PER_RUN');
    if(!selected) console.log('NO_PENDING_POSTS');
    else{ const {post,previousStateSha}=selected;
      const browserConfig=await localBrowserConfig(); editorContext=await openEditorContext(browserConfig); tempDir=await mkdtemp(join(tmpdir(),'nutriments-images-'));
      const page=await editorContext.newPage(); editorPage=page; page.setDefaultTimeout(25000);
      page.on('dialog',async d=>{const item={type:d.type(),message:d.message()};if(stage==='final-submit')finalSubmitDialogs.push(item);if(d.type()==='confirm'&&(/모드.*변경|변경.*모드/.test(d.message())||stage==='final-submit'))await d.accept();else if(d.type()==='alert')await d.accept();else await d.dismiss();});
      stage='editor-open'; await page.goto(`${BLOG}/manage/post`,{waitUntil:'domcontentloaded'}); if(new URL(page.url()).origin!==BLOG)throw new Error('E_LOGIN_REQUIRED'); await page.locator('#post-title-inp').waitFor({state:'visible'});
      stage='render'; const rendered=renderEditorialPost(post); const expected=editorialExpectations(post.bodyHtml); const sources=[...new Set(imageSources(rendered))]; const representativeSource=post.representativeImageUrl;
      const imageMap=new Map(); for(let i=0;i<sources.length;i++){stage=`image-upload-${i+1}`;imageMap.set(sources[i],await uploadImage(page,sources[i],i,tempDir));}
      const bodyHtml=replaceImageSources(rendered,imageMap,representativeSource);
      stage='stage-content'; await page.locator('#post-title-inp').fill(post.title); await page.locator('#editor-mode-layer-btn-open').click(); await page.locator('#editor-mode-html').click(); const code=page.locator('.CodeMirror:visible .CodeMirror-code');await code.waitFor({state:'visible'});await code.click();await page.keyboard.press('ControlOrMeta+A');await page.keyboard.insertText(bodyHtml);const staged=await page.locator('.CodeMirror:visible').evaluate(el=>el?.CodeMirror?.getValue?.()||'');assertEditorialContract(staged,post.bodyHtml);
      stage='category-tags'; await page.locator('#category-btn').click(); await page.locator('#category-list').waitFor({state:'visible'}); const matches=[]; for(const option of await page.locator('#category-list [role="option"]').all())if((await option.innerText()).trim().replace(/^-\s*/,'')===post.category)matches.push(option);if(matches.length!==1)throw new Error('E_CATEGORY_AMBIGUOUS');await matches[0].click();for(const tag of post.tags){await page.locator('#tagText').fill(tag);await page.locator('#tagText').press('Enter');}
      stage='publish-dialog'; await page.locator('#publish-layer-btn').click(); const thumb=page.locator('.publish_editor .box_thumb'); if(await thumb.count()!==1)throw new Error('E_REPRESENTATIVE_UNVERIFIED'); if(((await thumb.innerText().catch(()=>''))||'').includes('대표이미지 추가')){const repPath=join(tempDir,'representative.bin');await downloadImage(representativeSource,repPath);const input=thumb.locator('input[type="file"]');if(await input.count()!==1)throw new Error('E_REPRESENTATIVE_UNVERIFIED');await input.setInputFiles(repPath);await page.waitForFunction(()=>{const b=document.querySelector('.publish_editor .box_thumb');return !!b&&!((b.textContent||'').includes('대표이미지 추가'));},{timeout:10000});}
      await page.getByLabel('공개',{exact:true}).check(); const submit=page.getByRole('button',{name:'공개 발행',exact:true}); await submit.waitFor({state:'visible'}); if(await page.locator('#post-title-inp').inputValue()!==post.title)throw new Error('E_TITLE_MISMATCH');
      const sourceCommit=assertSourceCurrent(); const fp=fingerprint(post); const checkpoint=await ledger.write(post.id,{phase:'submitting',fingerprint:fp,sourceCommit,editorialTemplateVersion:EDITORIAL_TEMPLATE_VERSION,timestamp:new Date().toISOString()},previousStateSha);
      const checkpointCommit=checkpoint?.commit?.sha; if(!checkpointCommit)throw new Error('E_CHECKPOINT_COMMIT'); assertRemoteMain(checkpointCommit,'E_CHECKPOINT_DRIFT');
      stage='final-submit'; finalSubmitDialogs=[];
      const submitResponses=[]; const recordResponse=response=>{try{if(response.request().method()!=='POST')return;const u=new URL(response.url());submitResponses.push({host:u.host,path:u.pathname,status:response.status()});}catch{}};
      const readSignals=async()=>({notices:await page.locator('[role="alert"],.toast,.alert,.notice').evaluateAll(nodes=>nodes.map(n=>(n.textContent||'').replace(/\s+/g,' ').trim()).filter(Boolean).slice(0,8)).catch(()=>[]),layerText:((await page.locator('.publish_editor').innerText().catch(()=>''))||'').replace(/\s+/g,' ').trim().slice(0,800),dialogs:finalSubmitDialogs.slice(-8)});
      const classify=signals=>{const t=[...(signals.notices||[]),...(signals.dialogs||[]).map(x=>x.message),signals.layerText||''].join(' ');if(/하루.{0,30}(?:공개|새롭게).{0,30}발행|최대\s*(?:15|30)개|공개\s*발행.{0,30}제한/.test(t))return'E_TISTORY_DAILY_PUBLISH_LIMIT';if(/자동입력|보안문자|captcha|recaptcha|사람인지|로봇/i.test(t))return'E_TISTORY_HUMAN_VERIFICATION_REQUIRED';return null;};
      page.on('response',recordResponse);
      try{
        await submit.click({timeout:10000}); await page.waitForTimeout(1200);
        const immediate=await readSignals(); console.log('FINAL_SUBMIT_RESPONSES '+JSON.stringify(submitResponses.slice(-12))); console.log('FINAL_SUBMIT_SIGNALS '+JSON.stringify(immediate));
        const code=classify(immediate); if(code)throw new Error(code);
        try{await page.waitForURL(url=>url.origin===BLOG&&/\/manage\/posts\/?$/.test(url.pathname),{timeout:8000});}
        catch{await page.goto(`${BLOG}/manage/posts`,{waitUntil:'domcontentloaded'});}
      }catch(error){
        const signals=await readSignals(); console.log('FINAL_SUBMIT_RESPONSES '+JSON.stringify(submitResponses.slice(-12))); console.log('FINAL_SUBMIT_SIGNALS '+JSON.stringify(signals));
        const code=classify(signals); if(code)throw new Error(code);
        if(/^E_[A-Z_]+$/.test(error?.message??''))throw error;
        if(submitResponses.some(x=>x.status===429))throw new Error('E_PUBLISH_RATE_LIMIT');
        if(submitResponses.some(x=>x.status>=400))throw new Error('E_PUBLISH_HTTP');
        throw new Error('E_FINAL_SUBMIT_INTERACTION');
      }finally{page.off('response',recordResponse);}
      const titleLink=page.locator('a').filter({hasText:post.title}).first();
      if(!(await titleLink.isVisible().catch(()=>false))){const signals=await readSignals();console.log('FINAL_SUBMIT_POSTLIST '+JSON.stringify({urlPath:new URL(page.url()).pathname,signals}));const code=classify(signals);if(code)throw new Error(code);throw new Error('E_PUBLICATION_NOT_FOUND_AFTER_CLICK');}
      const publicUrls=await page.locator('a').evaluateAll((links,title)=>[...new Set(links.filter(a=>(a.textContent||'').trim()===title).map(a=>a.href).filter(href=>/^https:\/\/nutriments\.tistory\.com\/\d+$/.test(href)))],post.title); if(publicUrls.length!==1)throw new Error('E_PUBLICATION_UNCERTAIN'); const url=assertArticleUrl(publicUrls[0]);
      stage='public-verification'; publicBrowser=await openPublicBrowser(browserConfig); const desktop=await verifyPublic(publicBrowser,{url,title:post.title,targetHtml:bodyHtml,expected,prefix:'E_PUBLIC'}); const mobile=await verifyPublic(publicBrowser,{url,title:post.title,targetHtml:bodyHtml,expected,prefix:'E_PUBLIC',mobile:true});
      const state=await ledger.read(post.id); if(state?.phase!=='submitting'||state.fingerprint!==fp)throw new Error('E_LEDGER_CONFLICT'); await ledger.write(post.id,{phase:'published',fingerprint:fp,url,sourceCommit,editorialTemplateVersion:EDITORIAL_TEMPLATE_VERSION,timestamp:new Date().toISOString(),verification:'anonymous_full_body_editorial_pc_mobile',ogImage:desktop.og,mobile},state.sha); console.log(`PUBLISHED: ${post.id} ${url}`);
    }
  }
}catch(error){const code=/^E_[A-Z_]+$/.test(error?.message??'')?error.message:'E_RUNTIME';console.error(`DIAGNOSTIC: ${stage} ${code}`);console.error('STOP: failed or uncertain publication is never retried automatically.');process.exitCode=1;}
finally{for(const r of [publicBrowser,editorContext])try{await r?.close();}catch{console.error('E_LOCAL_BROWSER_CLOSE');process.exitCode=1;}if(tempDir)try{await rm(tempDir,{recursive:true,force:true});}catch{console.error('E_LOCAL_TEMP_CLEANUP');process.exitCode=1;}}
