import { BLOG } from './core.mjs';
import { loadUpdates } from './update-core.mjs';
import { localBrowserConfig, assertLocalGit, openEditorContext } from './local-browser.mjs';

function numericArticleUrls(links){
  return [...new Set(links.filter(href=>/^https:\/\/nutriments\.tistory\.com\/\d+$/.test(href)))].sort();
}

let context;
try{
  assertLocalGit();
  context=await openEditorContext(await localBrowserConfig());
  const page=await context.newPage();
  await page.goto(`${BLOG}/manage/posts`,{waitUntil:'domcontentloaded',timeout:45000});
  await page.getByRole('link',{name:'글쓰기',exact:true}).first().waitFor({state:'visible',timeout:15000});
  const u=new URL(page.url());
  if(u.origin!==BLOG||u.pathname!=='/manage/posts')throw new Error('E_LOGIN_REQUIRED');

  const updateId=process.env.SMOKE_UPDATE_ID?.trim();
  if(updateId){
    const updates=await loadUpdates();
    const update=updates.find(x=>x.id===updateId);
    if(!update)throw new Error('E_SMOKE_UPDATE_SOURCE');
    const matches=await page.locator('a').evaluateAll((links,expected)=>links.map(a=>({href:a.href,text:(a.textContent||'').trim()})).filter(x=>x.href===expected.url&&x.text===expected.title),{url:update.targetUrl,title:update.expectedCurrentTitle});
    if(matches.length!==1)throw new Error('E_SMOKE_UPDATE_TARGET_MISMATCH');
    const urls=numericArticleUrls(await page.locator('a').evaluateAll(links=>links.map(a=>a.href)));
    if(!urls.includes(update.targetUrl))throw new Error('E_SMOKE_UPDATE_TARGET_MISMATCH');
    console.log(`UPDATE_TARGET_PASS id=${update.id} articleId=${update.articleId} url=${update.targetUrl}`);
  }

  console.log('LOCAL_BROWSER_PASS / NUTRIMENTS_LOGIN_PASS / MUTATION_NOT_ATTEMPTED');
}catch(error){
  console.error(/^E_[A-Z_]+$/.test(error?.message??'')?error.message:'E_LOCAL_SMOKE');
  process.exitCode=1;
}finally{
  try{await context?.close();}catch{process.exitCode=1;}
}
