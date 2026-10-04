import { readFileSync,readdirSync } from 'node:fs';
const root=new URL('../',import.meta.url);
const read=p=>readFileSync(new URL(p,root),'utf8');
const fail=(m)=>{throw new Error(m)};
const core=read('publishing/core.mjs');
if(!core.includes("export const BLOG = 'https://nutriments.tistory.com'"))fail('BLOG_NOT_LOCKED');
if(!core.includes("export const EXPECTED_REPO = 'ansqhd5774-Choi/nutriments_blog'"))fail('REPO_NOT_LOCKED');
if(!core.includes("url.host !== BLOG_HOST"))fail('HOST_FAIL_CLOSED_MISSING');
for(const name of readdirSync(new URL('publishing/',root)).filter(x=>x.endsWith('.mjs'))){
  const s=read('publishing/'+name);
  if(/Browserbase|BROWSERBASE_|connectOverCDP|TinyFish|Remote.Desktop.Commander/i.test(s))fail('CLOUD_DEP_'+name);
  if(name!=='local-browser.mjs' && /nhunnhun\.tistory\.com/i.test(s))fail('FOREIGN_HOST_'+name);
}
const pub=read('.github/workflows/publish-posts.yml');
const upd=read('.github/workflows/update-posts.yml');
for(const [name,s] of [['publish',pub],['update',upd]]){
  if(!s.includes('runs-on: [self-hosted, windows, x64, nutriments-publisher]'))fail('RUNNER_LABEL_'+name);
  if(!s.includes('shell: cmd'))fail('CMD_ONLY_'+name);
  if(/powershell|pwsh|BROWSERBASE_/i.test(s))fail('FORBIDDEN_WORKFLOW_'+name);
  if(!s.includes("vars.NUTRIMENTS_TISTORY_ENABLED == 'true'"))fail('ENABLE_GATE_'+name);
}
if(pub.includes("'updates/**'")||pub.includes("'publishing/update.mjs'"))fail('PUBLISH_TRIGGER_LEAK');
if(upd.includes("'posts/**'")||upd.includes("'publishing/publish.mjs'"))fail('UPDATE_TRIGGER_LEAK');
if(pub.includes("'publishing/**'")||upd.includes("'publishing/**'"))fail('BROAD_TRIGGER');
for(const [name,s] of [['publish',pub],['update',upd]]){
  if(!s.includes('pnpm install --frozen-lockfile --ignore-scripts'))fail('FROZEN_LOCK_'+name);
  if(!s.includes("'pnpm-lock.yaml'"))fail('LOCKFILE_TRIGGER_'+name);
}
const editorial=read('publishing/editorial.mjs');
for(const needle of ["EDITORIAL_TEMPLATE_VERSION='R3'",'font-size:26px','font-size:20px','#fff1a8','#d9f99d','#bfdbfe','#fbcfe8','fetchpriority="high"','loading="lazy"','E_EDITORIAL_IMAGE_MINIMUM','E_EDITORIAL_IMAGE_ALT_REQUIRED'])if(!editorial.includes(needle))fail('EDITORIAL_CONTRACT_'+needle);
const publish=read('publishing/publish.mjs'), update=read('publishing/update.mjs');
for(const [name,s] of [['publish',publish],['update',update]]){
  if(!s.includes('assertSourceCurrent()'))fail('SOURCE_DRIFT_'+name);
  if(!s.includes('assertRemoteMain(checkpointCommit'))fail('CHECKPOINT_REMOTE_DRIFT_'+name);
  if(!s.includes('E_CHECKPOINT_COMMIT')||!s.includes('E_CHECKPOINT_DRIFT'))fail('CHECKPOINT_FAIL_CLOSED_'+name);
  if(s.indexOf("phase:'submitting'")<0||s.indexOf("phase:'submitting'")>s.indexOf("stage='final-submit'"))fail('CHECKPOINT_ORDER_'+name);
  if(!s.includes('openPublicBrowser'))fail('ANON_BROWSER_'+name);
  if(!s.includes('mobile:true'))fail('MOBILE_VERIFY_'+name);
}

if(!pub.includes('group: nutriments-tistory-mutation')||!upd.includes('group: nutriments-tistory-mutation'))fail('MUTATION_CONCURRENCY_LOCK');
if(!update.includes('E_UPDATE_CREATED_NEW_URL'))fail('UPDATE_SAME_URL_GUARD');
const updateCore=read('publishing/update-core.mjs');
if(!updateCore.includes('assertSafeBodyHtml(update.bodyHtml)'))fail('UPDATE_BODY_SAFETY_GUARD');
if(!core.includes('export function assertSafeBodyHtml'))fail('SHARED_BODY_SAFETY_GUARD');
const updateFiles=readdirSync(new URL('updates/',root)).filter(x=>x.endsWith('.json')).sort();
for(const name of updateFiles){
  const source=JSON.parse(read('updates/'+name));
  if(source.targetUrl!==`https://nutriments.tistory.com/${source.articleId}`)fail('UPDATE_TARGET_'+name);
  if(source.status==='ready'&&source.approved!==true)fail('UPDATE_APPROVAL_'+name);
  if(source.status==='ready'){
    const html=String(source.bodyHtml||'');
    const imgs=[...html.matchAll(/<img\b[^>]*\bsrc=(["'])(.*?)\1[^>]*>/gi)].map(m=>m[2]);
    if(imgs.length<3||new Set(imgs).size<3)fail('UPDATE_IMAGES_'+name);
    const tags=[...html.matchAll(/<img\b[^>]*>/gi)].map(m=>m[0]);
    if(tags.some(tag=>!(/\balt=(["'])(.*?)\1/i.test(tag))||!tag.match(/\balt=(["'])(.*?)\1/i)?.[2].trim()))fail('UPDATE_ALT_'+name);
    if(imgs[0]!==source.representativeImageUrl)fail('UPDATE_REP_FIRST_'+name);
    if((html.match(/<h2>/g)||[]).length<4)fail('UPDATE_H2_'+name);
    if(!/<blockquote><strong>핵심만 먼저:<\/strong>/.test(html))fail('UPDATE_QUICK_'+name);
    if(!/<h2>핵심 정리<\/h2>/.test(html)||!/<h2>자료 출처<\/h2>/.test(html))fail('UPDATE_R3_END_'+name);
    if((html.match(/<u>/g)||[]).length<2)fail('UPDATE_HIGHLIGHT_'+name);
  }
}

console.log('STATIC_CHECK_PASS');
