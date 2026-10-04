import { BLOG } from './core.mjs';
import { assertNutritionEvidence } from './nutrition-guard.mjs';
export const EDITORIAL_TEMPLATE_VERSION='R3';
const ACCENT='<div aria-hidden="true" style="width:34px;height:4px;background:#2563eb;border-radius:999px;margin:48px 0 10px;"></div>';
const H2='<h2 style="margin:0 0 18px;padding:0;font-size:26px;line-height:1.4;font-weight:800;letter-spacing:-0.02em;color:#111827;border:0;background:none;">';
const H3='<h3 style="margin:30px 0 10px;padding:0;font-size:20px;line-height:1.45;font-weight:800;letter-spacing:-0.01em;color:#1f2937;border:0;background:none;">';
const HIGHLIGHT_COLORS=['#fff1a8','#d9f99d','#bfdbfe','#fbcfe8'];
const count=(html,re)=>[...html.matchAll(re)].length;
const imageTags=html=>[...html.matchAll(/<img\b[^>]*>/gi)].map(m=>m[0]);
const imageSources=html=>[...html.matchAll(/<img\b[^>]*\bsrc=(["'])(.*?)\1[^>]*>/gi)].map(m=>m[2]);
const externalLinks=html=>[...html.matchAll(/<a\b[^>]*\bhref=(["'])(https:\/\/[^"']+)\1[^>]*>/gi)].map(m=>m[2]).filter(x=>!x.startsWith(BLOG+'/'));
function topicFromTitle(title=''){return String(title).trim().split(/[\s·:—-]+/)[0]||'';}
function applyHighlights(html){let i=0;return html.replace(/<u>([\s\S]*?)<\/u>/g,(_m,x)=>`<span style="background:linear-gradient(transparent 45%,${HIGHLIGHT_COLORS[i++%HIGHLIGHT_COLORS.length]} 45%);padding:0 .06em;">${x}</span>`);}
function styleTable(inner){
  let t=inner.replace(/<thead><tr>/g,'<thead><tr style="background:#f5f6f8;">').replace(/<th>/g,'<th style="padding:11px 12px;border-bottom:1px solid #dfe4ea;text-align:left;font-weight:700;">').replace(/<td>/g,'<td style="padding:10px 12px;border-top:1px solid #eef1f4;vertical-align:top;">');
  return `<div style="overflow-x:auto;margin:14px 0 10px;border:1px solid #e5e7eb;border-radius:8px;"><table style="width:100%;min-width:520px;border-collapse:collapse;margin:0;background:#fff;font-size:14px;line-height:1.55;">${t}</table></div>`;
}
export function assertEditorialSource(post){
  const html=post.bodyHtml; const imgs=imageSources(html); const tags=imageTags(html); const h2=count(html,/<h2>/g);
  if(h2<4) throw new Error('E_EDITORIAL_SOURCE_TOO_THIN');
  if(!/<h2>핵심 정리<\/h2>/.test(html)) throw new Error('E_EDITORIAL_SUMMARY_REQUIRED');
  if(!/<h2>자료 출처<\/h2>/.test(html)) throw new Error('E_EDITORIAL_SOURCES_REQUIRED');
  if(imgs.length<3 || new Set(imgs).size<3) throw new Error('E_EDITORIAL_IMAGE_MINIMUM');
  if(tags.some(tag=>{const alt=tag.match(/\balt=(["'])(.*?)\1/i);return !alt||!alt[2].trim();})) throw new Error('E_EDITORIAL_IMAGE_ALT_REQUIRED');
  const firstImage=html.search(/<img\b/i), firstH2=html.indexOf('<h2>');
  if(firstImage<0||firstH2<0||firstImage>firstH2) throw new Error('E_EDITORIAL_HERO_REQUIRED');
  if(!/^\s*<p>\s*<img\b[^>]*>\s*<\/p>\s*<p>/i.test(html)) throw new Error('E_EDITORIAL_LEAD_REQUIRED');
  if(!/<blockquote><strong>핵심만 먼저:<\/strong>[\s\S]*?<\/blockquote>/.test(html.slice(0,firstH2))) throw new Error('E_EDITORIAL_QUICK_REQUIRED');
  if(!post.representativeImageUrl || imgs[0]!==post.representativeImageUrl) throw new Error('E_REPRESENTATIVE_IMAGE_REQUIRED');
  const sourceBlock=html.match(/<h2>자료 출처<\/h2>\s*<ul>([\s\S]*?)<\/ul>/)?.[1] || '';
  if(new Set(externalLinks(sourceBlock)).size<2) throw new Error('E_EDITORIAL_EVIDENCE_REQUIRED');
  assertNutritionEvidence(post);
  return post;
}
export function editorialExpectations(sourceHtml){
  const latest=count(sourceHtml,/<h2>최신 근거\s*·?\s*\d{4}<\/h2>\s*<blockquote>/g);
  return {h2:count(sourceHtml,/<h2>/g)-latest,h3:count(sourceHtml,/<h3>/g),tables:count(sourceHtml,/<table>/g),images:count(sourceHtml,/<img\b/g),highlights:count(sourceHtml,/<u>/g),faq:count(sourceHtml,/<p><strong>Q\.\s*[^<]+<\/strong><br\/?/g),latest,quick:/<blockquote><strong>핵심만 먼저:<\/strong>/.test(sourceHtml)?1:0,summary:/<h2>핵심 정리<\/h2>/.test(sourceHtml)?1:0,related:/<h2>함께 보면 좋은 글<\/h2>/.test(sourceHtml)?1:0,relatedLinks:(sourceHtml.match(new RegExp(`<p><a href="${BLOG.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}\\/[^\"]+"><strong>[^<]+<\\/strong><\\/a><\\/p>`,'g'))||[]).length,sources:1};
}
export function applyEditorialTemplate(html,{title=''}={}){
  let out=applyHighlights(html); const topic=topicFromTitle(title);
  out=out.replace(/<p>\s*(<img\b[^>]*>)\s*<\/p>\s*<p>/i,(_m,img)=>'<p>'+img.replace(/>$/,' loading="eager" fetchpriority="high" decoding="async" style="width:100%;max-width:720px;height:auto;display:block;margin:18px auto 24px;">')+'</p><p style="margin:0 0 20px;font-size:16px;line-height:1.8;color:#374151;">');
  out=out.replace(/<p>\s*(<img\b[^>]*>)\s*<\/p>/gi,(_m,img)=>'<p>'+(/style=/.test(img)?img:img.replace(/>$/,' loading="lazy" decoding="async" style="width:100%;max-width:720px;height:auto;display:block;margin:18px auto 24px;">'))+'</p>');
  out=out.replace(/<blockquote><strong>핵심만 먼저:<\/strong>\s*([\s\S]*?)<\/blockquote>/,'<div style="margin:20px 0 28px;padding:18px 20px;background:#f7f9fc;border:1px solid #e5eaf0;border-radius:10px;"><p style="margin:0 0 10px;font-size:19px;font-weight:800;color:#111827;">'+(topic?topic+', ':'')+'이것만 먼저 보세요</p><p style="margin:0;line-height:1.8;color:#374151;">$1</p></div>');
  out=out.replace(/<h2>(최신 근거\s*·?\s*\d{4})<\/h2>\s*<blockquote>([\s\S]*?)<\/blockquote>/g,'<div style="margin:28px 0 32px;padding:16px 18px;border:1px solid #dfe5ec;border-radius:8px;background:#fbfcfe;"><p style="margin:0 0 10px;font-size:12px;font-weight:800;letter-spacing:.04em;color:#2563eb;">$1</p>$2</div>');
  out=out.replace(/<h2>/g,ACCENT+H2).replace(/<h3>/g,H3).replace(/<table>\s*([\s\S]*?)\s*<\/table>/g,(_m,x)=>styleTable(x));
  out=out.replace(/<blockquote>/g,'<blockquote style="margin:18px 0 28px;padding:16px 18px;background:#f8fafc;border-left:4px solid #334155;color:#1f2937;">');
  out=out.replace(/<p><strong>Q\.\s*([^<]+)<\/strong><br\/?>([\s\S]*?)<\/p>/g,'<div style="margin:0 0 24px;padding:16px 18px;background:#f8fafc;border:1px solid #e5e7eb;border-radius:8px;"><p style="margin:0 0 8px;font-size:16px;font-weight:800;color:#111827;"><span style="display:inline-block;margin-right:6px;color:#2563eb;">Q.</span>$1</p><p style="margin:0;color:#374151;line-height:1.75;"><span style="font-weight:700;color:#6b7280;margin-right:6px;">A.</span>$2</p></div>');
  out=out.replace(/(<h2[^>]*>핵심 정리<\/h2>)\s*<ul>([\s\S]*?)<\/ul>/,'$1<div style="margin:0 0 12px;padding:16px 18px;background:#f8fafc;border:1px solid #e5e7eb;border-radius:8px;"><ul style="margin:0;padding-left:20px;line-height:1.85;">$2</ul></div>');
  const escaped=BLOG.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  out=out.replace(new RegExp(`(<h2[^>]*>함께 보면 좋은 글<\\/h2>)((?:\\s*<p><a href="${escaped}\\/[^\"]+"><strong>[^<]+<\\/strong><\\/a><\\/p>)+)`),(_m,head,block)=>head+[...block.matchAll(/<p><a href="([^"]+)"><strong>([^<]+)<\/strong><\/a><\/p>/g)].map(x=>`<div style="margin:0 0 10px;padding:14px 16px;border:1px solid #e5e7eb;border-radius:8px;background:#fff;"><a href="${x[1]}" style="font-weight:800;text-decoration:none;">${x[2]} →</a></div>`).join(''));
  out=out.replace(/(<h2[^>]*>자료 출처<\/h2>)\s*<ul>/,'$1<ul style="margin:0;padding-left:20px;font-size:14px;line-height:1.75;color:#4b5563;">');
  return out;
}
export function assertEditorialContract(renderedHtml,sourceHtml){
  const e=editorialExpectations(sourceHtml); const h2=count(renderedHtml,/<h2\b/g),h3=count(renderedHtml,/<h3\b/g),tables=count(renderedHtml,/<table\b/g),imgs=count(renderedHtml,/<img\b/g),highlights=count(renderedHtml,/<span style="background:linear-gradient\(transparent 45%,#[0-9a-f]{6} 45%\);padding:0 \.06em;">/gi); const colors=new Set([...renderedHtml.matchAll(/linear-gradient\(transparent 45%,(#[0-9a-f]{6}) 45%\)/gi)].map(m=>m[1].toLowerCase()));
  const eager=count(renderedHtml,/<img\b[^>]*loading="eager"[^>]*fetchpriority="high"[^>]*>/gi), lazy=count(renderedHtml,/<img\b[^>]*loading="lazy"[^>]*>/gi);
  const q=count(renderedHtml,/>Q\.<\/span>/g), a=count(renderedHtml,/>A\.<\/span>/g);
  const latest=count(renderedHtml,/<div\b[^>]*background:#fbfcfe;[^>]*>[\s\S]*?최신 근거\s*·?\s*\d{4}[\s\S]*?<\/div>/g);
  const escaped=BLOG.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  const relatedCards=count(renderedHtml,new RegExp(`<a href="${escaped}\/[^"]+" style="font-weight:800;text-decoration:none;">`,'g'));
  if(h2!==e.h2||count(renderedHtml,/<h2\b[^>]*font-size:26px[^>]*font-weight:800[^>]*>/g)!==e.h2||count(renderedHtml,/width:34px;height:4px;background:#2563eb/g)!==e.h2) throw new Error('E_EDITORIAL_H2_CONTRACT');
  if(h3!==e.h3||count(renderedHtml,/<h3\b[^>]*font-size:20px[^>]*font-weight:800[^>]*>/g)!==e.h3) throw new Error('E_EDITORIAL_H3_CONTRACT');
  if(tables!==e.tables||count(renderedHtml,/<div style="overflow-x:auto;[^"]*"><table\b/g)!==e.tables) throw new Error('E_EDITORIAL_TABLE_CONTRACT');
  if(imgs!==e.images||count(renderedHtml,/<img\b[^>]*style="[^"]*width:100%;[^"]*max-width:720px;[^"]*"/g)!==e.images||eager!==(e.images?1:0)||lazy!==Math.max(0,e.images-1)) throw new Error('E_EDITORIAL_IMAGE_CONTRACT');
  if(highlights!==e.highlights||(e.highlights>=2&&colors.size<2)) throw new Error('E_EDITORIAL_HIGHLIGHT_CONTRACT');
  if(q!==e.faq||a!==e.faq) throw new Error('E_EDITORIAL_FAQ_CONTRACT');
  if(latest!==e.latest) throw new Error('E_EDITORIAL_LATEST_CONTRACT');
  if(e.quick&&!/이것만 먼저 보세요<\/p>/.test(renderedHtml)) throw new Error('E_EDITORIAL_QUICK_CONTRACT');
  if(e.summary&&!/핵심 정리<\/h2><div style="margin:0 0 12px;padding:16px 18px;background:#f8fafc;/.test(renderedHtml)) throw new Error('E_EDITORIAL_SUMMARY_CONTRACT');
  if(e.related&&relatedCards!==e.relatedLinks) throw new Error('E_EDITORIAL_RELATED_CONTRACT');
  if(e.sources&&!/자료 출처<\/h2><ul style="margin:0;padding-left:20px;font-size:14px;/.test(renderedHtml)) throw new Error('E_EDITORIAL_SOURCES_CONTRACT');
  return renderedHtml;
}
export function renderEditorialPost(post){assertEditorialSource(post);return assertEditorialContract(applyEditorialTemplate(post.bodyHtml,{title:post.title}),post.bodyHtml);}
