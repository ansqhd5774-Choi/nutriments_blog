import { BLOG } from './core.mjs';
import { localBrowserConfig, openEditorContext } from './local-browser.mjs';
let context;
try{
  context=await openEditorContext(await localBrowserConfig(),{headless:false}); const page=await context.newPage(); await page.goto(`${BLOG}/manage/posts`,{waitUntil:'domcontentloaded'}); console.log('WAITING_FOR_USER_LOGIN: use this dedicated Nutriments Chrome window only.'); const deadline=Date.now()+240000; let ok=false;
  while(Date.now()<deadline){if(page.isClosed())break;const url=new URL(page.url());if(url.origin===BLOG&&url.pathname==='/manage/posts'&&await page.getByRole('link',{name:'글쓰기',exact:true}).count()>0){ok=true;break;}await new Promise(r=>setTimeout(r,2000));}
  if(!ok)throw new Error('E_LOGIN_REQUIRED'); await page.waitForTimeout(5000); await page.goto(`${BLOG}/manage/posts`,{waitUntil:'domcontentloaded'}); await page.getByRole('link',{name:'글쓰기',exact:true}).first().waitFor({state:'visible',timeout:15000}); await context.close();context=null; context=await openEditorContext(await localBrowserConfig()); const verify=await context.newPage();await verify.goto(`${BLOG}/manage/posts`,{waitUntil:'domcontentloaded'});await verify.getByRole('link',{name:'글쓰기',exact:true}).first().waitFor({state:'visible',timeout:15000});if(new URL(verify.url()).origin!==BLOG)throw new Error('E_LOGIN_NOT_PERSISTED');console.log('LOGIN_SAVED');
}catch(error){console.error(/^E_[A-Z_]+$/.test(error?.message??'')?error.message:'E_LOGIN_SETUP');process.exitCode=1;}finally{try{await context?.close();}catch{process.exitCode=1;}}
