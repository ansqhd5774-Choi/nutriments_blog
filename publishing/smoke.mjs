import { BLOG } from './core.mjs';
import { loadUpdates } from './update-core.mjs';
import { renderEditorialPost, editorialExpectations } from './editorial.mjs';
import { verifyPublic } from './runtime-common.mjs';
import { localBrowserConfig, assertLocalGit, openEditorContext, openPublicBrowser } from './local-browser.mjs';

let editorContext,publicBrowser;
try {
  assertLocalGit();
  const config=await localBrowserConfig();
  editorContext=await openEditorContext(config);
  const updates=await loadUpdates();

  for(const update of updates){
    const audit=await editorContext.newPage();
    try{
      await audit.goto(`${BLOG}/manage/newpost/${update.articleId}`,{waitUntil:'domcontentloaded',timeout:45000});
      if(new URL(audit.url()).origin!==BLOG) throw new Error('E_LOGIN_REQUIRED');
      await audit.locator('#post-title-inp').waitFor({state:'visible',timeout:15000});
      const currentTitle=(await audit.locator('#post-title-inp').inputValue()).trim();
      console.log(`ADMIN_CURRENT_TITLE articleId=${update.articleId} title=${currentTitle}`);
      if(currentTitle!==update.title) throw new Error('E_RECOVERY_ADMIN_TITLE');
    } finally { try{await audit.close();}catch{} }

    const targetHtml=renderEditorialPost(update);
    const expected=editorialExpectations(update.bodyHtml);
    publicBrowser=await openPublicBrowser(config);
    const desktop=await verifyPublic(publicBrowser,{url:update.targetUrl,title:update.title,targetHtml,expected,prefix:'E_RECOVERY_PUBLIC'});
    const mobile=await verifyPublic(publicBrowser,{url:update.targetUrl,title:update.title,targetHtml,expected,prefix:'E_RECOVERY_PUBLIC',mobile:true});
    console.log(`RECOVERY_PUBLIC_PC ${JSON.stringify(desktop)}`);
    console.log(`RECOVERY_PUBLIC_MOBILE ${JSON.stringify(mobile)}`);
  }

  console.log('RECOVERY_VERIFY_PASS / MUTATION_NOT_ATTEMPTED');
}catch(error){
  console.error(/^E_[A-Z0-9_]+$/.test(error?.message??'')?error.message:'E_LOCAL_SMOKE');
  process.exitCode=1;
}finally{
  try{await publicBrowser?.close();}catch{process.exitCode=1;}
  try{await editorContext?.close();}catch{process.exitCode=1;}
}
