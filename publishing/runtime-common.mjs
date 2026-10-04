import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { BLOG, assertArticleUrl } from './core.mjs';

export function imageSources(html){return [...html.matchAll(/<img\b[^>]*\bsrc=(["'])(.*?)\1[^>]*>/gi)].map(m=>m[2]);}
export async function downloadImage(url,path){
  let last='';
  for(let attempt=0;attempt<4;attempt++){
    const response=await fetch(url,{headers:{'User-Agent':'Mozilla/5.0','Accept':'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'},signal:AbortSignal.timeout(20000)});
    if(response.ok){const type=response.headers.get('content-type')??'';if(!type.toLowerCase().startsWith('image/'))throw new Error('E_IMAGE_CONTENT_TYPE');const bytes=Buffer.from(await response.arrayBuffer());if(!bytes.length||bytes.length>12*1024*1024)throw new Error('E_IMAGE_SIZE');await writeFile(path,bytes);return;}
    last=String(response.status); await new Promise(r=>setTimeout(r,500));
  }
  throw new Error('E_IMAGE_DOWNLOAD_'+last);
}
export async function uploadImage(page,sourceUrl,index,tempDir){
  const path=join(tempDir,`tistory-image-${index}.bin`); await downloadImage(sourceUrl,path);
  await page.evaluate(()=>document.querySelectorAll('#attach-layer-btn')[0]?.click());
  const responsePromise=page.waitForResponse(res=>res.url().includes('/manage/post/attach.json')&&res.request().method()==='POST'&&res.status()===200,{timeout:30000});
  await page.locator('#attach-image').setInputFiles(path); const data=await (await responsePromise).json();
  if(!data?.url||!data.url.includes('kakaocdn.net'))throw new Error('E_IMAGE_UPLOAD'); return data.url;
}
export function replaceImageSources(html,mapping,representativeSource){
  let first=true;
  return html.replace(/<img\b[^>]*>/gi,tag=>{const match=tag.match(/\bsrc=(["'])(.*?)\1/i);if(!match)return tag;const target=mapping.get(match[2]);if(!target)throw new Error('E_IMAGE_MAPPING');let out=tag.replace(match[0],`src="${target}"`);out=out.replace(/\s(?:loading|decoding|fetchpriority)=(["']).*?\1/gi,'');const priority=match[2]===representativeSource||first;out=out.replace(/>$/,` loading="${priority?'eager':'lazy'}" decoding="async"${priority?' fetchpriority="high"':''}>`);first=false;return out;});
}
export function remoteMainSha(){
  return execFileSync('git',['ls-remote','origin','refs/heads/main'],{encoding:'utf8'}).trim().split(/\s+/)[0]||'';
}
export function assertRemoteMain(expectedSha, code='E_SOURCE_DRIFT'){
  const remoteMain=remoteMainSha();
  if(!remoteMain||remoteMain!==expectedSha) throw new Error(code);
  return remoteMain;
}
export function assertSourceCurrent(){
  const sourceCommit=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
  assertRemoteMain(sourceCommit,'E_SOURCE_DRIFT');
  return sourceCommit;
}
export async function materializedText(page,html){return page.evaluate(markup=>{const host=document.createElement('div');host.setAttribute('aria-hidden','true');host.style.cssText='position:fixed;left:-100000px;top:0;width:800px;opacity:0;pointer-events:none;';host.innerHTML=markup;document.body.appendChild(host);const text=(host.innerText||host.textContent||'').replace(/\s+/g,' ').trim();host.remove();return text;},html);}
export async function editorialSnapshot(content){
  return content.evaluate(root=>{const h2=[...root.querySelectorAll('h2')],h3=[...root.querySelectorAll('h3')],tables=[...root.querySelectorAll('table')],images=[...root.querySelectorAll('img')],highlights=[...root.querySelectorAll('span')].filter(x=>/background:\s*linear-gradient\(transparent 45%,#[0-9a-f]{6} 45%\)/i.test(x.getAttribute('style')||''));const colors=new Set(highlights.map(x=>((x.getAttribute('style')||'').match(/linear-gradient\(transparent 45%,(#[0-9a-f]{6}) 45%\)/i)||[])[1]).filter(Boolean).map(x=>x.toLowerCase()));const summary=[...h2].find(x=>x.textContent.trim()==='핵심 정리'),related=[...h2].find(x=>x.textContent.trim()==='함께 보면 좋은 글'),sources=[...h2].find(x=>x.textContent.trim()==='자료 출처');return {
    h2:h2.length,h2Styled:h2.filter(x=>/font-size:\s*26px/.test(x.getAttribute('style')||'')&&/font-weight:\s*800/.test(x.getAttribute('style')||'')).length,
    h3:h3.length,h3Styled:h3.filter(x=>/font-size:\s*20px/.test(x.getAttribute('style')||'')&&/font-weight:\s*800/.test(x.getAttribute('style')||'')).length,
    accents:[...root.querySelectorAll('div[aria-hidden="true"]')].filter(x=>/width:\s*34px/.test(x.getAttribute('style')||'')&&/height:\s*4px/.test(x.getAttribute('style')||'')).length,
    tables:tables.length,tableWraps:tables.filter(t=>/overflow-x:\s*auto/.test(t.parentElement?.getAttribute('style')||'')).length,
    images:images.length,responsiveImages:images.filter(i=>/width:\s*100%/.test(i.getAttribute('style')||'')&&/max-width:\s*720px/.test(i.getAttribute('style')||'')).length,nativeImages:images.filter(i=>i.src.includes('kakaocdn.net')).length,priorityImages:images.filter(i=>i.getAttribute('loading')==='eager'&&i.getAttribute('fetchpriority')==='high').length,lazyImages:images.filter(i=>i.getAttribute('loading')==='lazy').length,
    highlights:highlights.length,highlightColors:colors.size,quickCards:[...root.querySelectorAll('p')].filter(p=>/이것만 먼저 보세요$/.test(p.textContent.trim())&&/background:\s*#f7f9fc/.test(p.parentElement?.getAttribute('style')||'')).length,
    faqQ:[...root.querySelectorAll('span')].filter(x=>x.textContent.trim()==='Q.').length,faqA:[...root.querySelectorAll('span')].filter(x=>x.textContent.trim()==='A.').length,
    latest:[...root.querySelectorAll('div')].filter(x=>/최신 근거\s*·?\s*\d{4}/.test(x.textContent)&&/background:\s*#fbfcfe/.test(x.getAttribute('style')||'')).length,
    summaryBox:!!(summary?.nextElementSibling&&/background:\s*#f8fafc/.test(summary.nextElementSibling.getAttribute('style')||'')),relatedCards:related?(()=>{let n=0,e=related.nextElementSibling;while(e&&e.tagName!=='H2'){if(e.querySelector?.('a[style*="text-decoration:none"]'))n++;e=e.nextElementSibling;}return n;})():0,sourcesStyled:!!(sources?.nextElementSibling&&sources.nextElementSibling.tagName==='UL'&&/font-size:\s*14px/.test(sources.nextElementSibling.getAttribute('style')||''))
  };});
}
export function assertSnapshot(s,e,prefix='E_PUBLIC'){
  if(s.h2!==e.h2||s.h2Styled!==e.h2||s.accents!==e.h2)throw new Error(prefix+'_H2');
  if(s.h3!==e.h3||s.h3Styled!==e.h3)throw new Error(prefix+'_H3');
  if(s.tables!==e.tables||s.tableWraps!==e.tables)throw new Error(prefix+'_TABLE');
  if(s.images!==e.images||s.responsiveImages!==e.images||s.nativeImages<e.images||s.priorityImages!==(e.images?1:0)||s.lazyImages!==Math.max(0,e.images-1))throw new Error(prefix+'_IMAGE');
  if(s.highlights!==e.highlights||(e.highlights>=2&&s.highlightColors<2))throw new Error(prefix+'_HIGHLIGHT');
  if(s.quickCards!==e.quick||s.faqQ!==e.faq||s.faqA!==e.faq||s.latest!==e.latest)throw new Error(prefix+'_EDITORIAL');
  if(e.summary&&!s.summaryBox)throw new Error(prefix+'_SUMMARY'); if(e.related&&s.relatedCards!==e.relatedLinks)throw new Error(prefix+'_RELATED'); if(e.sources&&!s.sourcesStyled)throw new Error(prefix+'_SOURCES');
}
export async function verifyPublic(browser,{url,title,targetHtml,expected,prefix='E_PUBLIC',mobile=false}){
  assertArticleUrl(url);
  const context=await browser.newContext(mobile?{viewport:{width:390,height:844},userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1'}:{viewport:{width:1440,height:1000}});
  try{
    const page=await context.newPage();
    await page.goto(url,{waitUntil:'domcontentloaded'});
    if(new URL(page.url()).origin!==BLOG)throw new Error(prefix+'_HOST');
    const body=await page.locator('body').innerText();
    if(!body.includes(title))throw new Error(prefix+'_TITLE');
    const content=page.locator('.contents_style');
    if(await content.count()!==1)throw new Error(prefix+'_CONTENT');
    const actual=(await content.innerText()).replace(/\s+/g,' ').trim();
    const expectedText=await materializedText(page,targetHtml);
    if(!expectedText||actual!==expectedText)throw new Error(prefix+'_BODY');
    const og=await page.locator('meta[property="og:image"]').getAttribute('content').catch(()=>null);
    if(!og||og.includes('opengraph.png')||!og.includes('kakaocdn.net'))throw new Error(prefix+'_OG');
    const snapshot=await editorialSnapshot(content);
    assertSnapshot(snapshot,expected,prefix);
    const metrics=await page.evaluate(()=>({
      overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth+4,
      wideImages:[...document.querySelectorAll('.contents_style img')].filter(x=>x.getBoundingClientRect().width>document.documentElement.clientWidth+4).length
    }));
    if(metrics.overflow)throw new Error(prefix+(mobile?'_MOBILE_OVERFLOW':'_PC_OVERFLOW'));
    if(mobile&&metrics.wideImages)throw new Error(prefix+'_MOBILE_OVERFLOW');
    return mobile?{snapshot,og,...metrics}:{snapshot,og,overflow:metrics.overflow};
  }finally{await context.close();}
}
