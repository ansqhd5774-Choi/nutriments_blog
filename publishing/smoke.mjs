import { BLOG } from './core.mjs';
import { loadUpdates } from './update-core.mjs';
import { localBrowserConfig, assertLocalGit, openEditorContext } from './local-browser.mjs';

let context;
try {
  assertLocalGit();
  context=await openEditorContext(await localBrowserConfig());
  const page=await context.newPage();
  await page.goto(`${BLOG}/manage/posts`,{waitUntil:'domcontentloaded',timeout:45000});
  await page.getByRole('link',{name:'글쓰기',exact:true}).first().waitFor({state:'visible',timeout:15000});
  const u=new URL(page.url());
  if(u.origin!==BLOG||u.pathname!=='/manage/posts') throw new Error('E_LOGIN_REQUIRED');

  for(const update of await loadUpdates()){
    const listEvidence=await page.locator('a').evaluateAll((links,expected)=>{
      const normalize=v=>(v||'').replace(/\s+/g,' ').trim();
      const matches=links.filter(a=>normalize(a.textContent)===expected.title);
      return matches.map(a=>{
        const container=a.closest('tr,li,[role="row"],article,section,div');
        const siblingLinks=container?[...container.querySelectorAll('a')].slice(0,12).map(x=>({text:normalize(x.textContent),href:x.getAttribute('href')||''})):[];
        return {text:normalize(a.textContent),href:a.getAttribute('href')||'',absoluteHref:a.href||'',siblingLinks};
      });
    },{title:update.expectedCurrentTitle});
    console.log(`ADMIN_LIST_EVIDENCE articleId=${update.articleId} ${JSON.stringify(listEvidence)}`);

    const audit=await context.newPage();
    try{
      await audit.goto(`${BLOG}/manage/newpost/${update.articleId}`,{waitUntil:'domcontentloaded',timeout:45000});
      if(new URL(audit.url()).origin!==BLOG) throw new Error('E_LOGIN_REQUIRED');
      await audit.locator('#post-title-inp').waitFor({state:'visible',timeout:15000});
      const currentTitle=(await audit.locator('#post-title-inp').inputValue()).trim();
      if(currentTitle!==update.expectedCurrentTitle) throw new Error('E_UPDATE_CURRENT_TITLE_MISMATCH');
      if(update.targetUrl!==`${BLOG}/${update.articleId}`) throw new Error('E_UPDATE_URL');
      console.log(`TARGET_AUDIT_PASS articleId=${update.articleId} url=${update.targetUrl} title=${currentTitle}`);
    } finally {
      try{await audit.close();}catch{}
    }
  }

  console.log('LOCAL_BROWSER_PASS / NUTRIMENTS_LOGIN_PASS / TARGET_AUDIT_PASS / MUTATION_NOT_ATTEMPTED');
}catch(error){
  console.error(/^E_[A-Z_]+$/.test(error?.message??'')?error.message:'E_LOCAL_SMOKE');
  process.exitCode=1;
}finally{
  try{await context?.close();}catch{process.exitCode=1;}
}
