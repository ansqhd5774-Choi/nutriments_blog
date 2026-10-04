import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { BLOG } from './core.mjs';
import { loadUpdates } from './update-core.mjs';
import { imageSources, downloadImage } from './runtime-common.mjs';
import { localBrowserConfig, assertLocalGit, openEditorContext } from './local-browser.mjs';

let context,tempDir;
try {
  assertLocalGit();
  context=await openEditorContext(await localBrowserConfig());
  const page=await context.newPage();
  await page.goto(`${BLOG}/manage/posts`,{waitUntil:'domcontentloaded',timeout:45000});
  await page.getByRole('link',{name:'글쓰기',exact:true}).first().waitFor({state:'visible',timeout:15000});
  const u=new URL(page.url());
  if(u.origin!==BLOG||u.pathname!=='/manage/posts') throw new Error('E_LOGIN_REQUIRED');
  await page.waitForTimeout(3000);
  tempDir=await mkdtemp(join(tmpdir(),'nutriments-smoke-'));

  for(const update of await loadUpdates()){
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

    const sources=[...new Set(imageSources(update.bodyHtml))];
    for(let i=0;i<sources.length;i++){
      try{
        await downloadImage(sources[i],join(tempDir,`image-${i}.bin`));
        console.log(`IMAGE_DOWNLOAD_PASS index=${i} url=${sources[i]}`);
      }catch(error){
        console.log(`IMAGE_DOWNLOAD_FAIL index=${i} url=${sources[i]} code=${error?.message||error}`);
        throw error;
      }
    }
  }

  console.log('LOCAL_BROWSER_PASS / NUTRIMENTS_LOGIN_PASS / TARGET_AUDIT_PASS / IMAGE_DOWNLOAD_PASS / MUTATION_NOT_ATTEMPTED');
}catch(error){
  console.error(/^E_[A-Z0-9_]+$/.test(error?.message??'')?error.message:'E_LOCAL_SMOKE');
  process.exitCode=1;
}finally{
  try{await context?.close();}catch{process.exitCode=1;}
  if(tempDir)try{await rm(tempDir,{recursive:true,force:true});}catch{process.exitCode=1;}
}
