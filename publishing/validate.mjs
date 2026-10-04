import { loadPosts, checkPublishHtml, eligible } from './core.mjs';
import { Ledger } from './ledger.mjs';
import { renderEditorialPost, EDITORIAL_TEMPLATE_VERSION } from './editorial.mjs';
try{
  const posts=await loadPosts(); const ledger=new Ledger(); let pending=0;
  for(const post of posts){const state=await ledger.read(post.id);if(eligible(post,state)){checkPublishHtml(post);renderEditorialPost(post);pending++;}}
  if(pending>1) throw new Error('E_ONE_POST_PER_RUN');
  console.log(`PASS: ${posts.length} posts validated; ${pending} pending; editorial=${EDITORIAL_TEMPLATE_VERSION}.`);
}catch(error){const code=/^E_[A-Z_]+$/.test(error?.message??'')?error.message:'E_VALIDATE_RUNTIME';console.error(`FAIL: ${code}`);process.exitCode=1;}
