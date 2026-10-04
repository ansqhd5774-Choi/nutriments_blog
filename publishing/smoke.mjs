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
  await page.waitForTimeout(3000);

  for(const update of await loadUpdates()){
    const listEvidence=await page.locator('body').evaluate((body,expected)=>{
      const normalize=v=>(v||'').replace(/\s+/g,' ').trim();
      const all=[...body.querySelectorAll('*')];
      const exact=all.filter(el=>normalize(el.textContent)===expected.title && ![...el.children].some(c=>normalize(c.textContent)===expected.title)).slice(0,20).map(el=>({
        tag:el.tagName.toLowerCase(),
        role:el.getAttribute('role')||'',
        className:typeof el.className==='string'?el.className:'',
        href:el.getAttribute('href')||'',
        dataId:el.getAttribute('data-id')||el.getAttribute('data-article-id')||el.getAttribute('data-post-id')||''
      }));
      const relevantLinks=[...body.querySelectorAll('a[href]')].filter(a=>{
        const href=a.getAttribute('href')||'';
        const text=normalize(a.textContent);
        return text.includes(expected.keyword)||href.includes(expected.articleId)||href.includes('/manage/newpost/');
      }).slice(0,40).map(a=>({text:normalize(a.textContent),href:a.getAttribute('href')||'',absoluteHref:a.href||''}));
      const bodyText=normalize(body.innerText);
      const index=bodyText.indexOf(expected.title);
      return {
        exactTitlePresent:index>=0,
        exactNodes:exact,
        relevantLinks,
        titleContext:index>=0?bodyText.slice(Math.max(0,index-160),index+expected.title.length+160):''
      };
    },{title:update.expectedCurrentTitle,articleId:update.articleId,keyword:'유산균'});
    console.log(`ADMIN_LIST_DOM articleId=${update.articleId} ${JSON.stringify(listEvidence)}`);

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
