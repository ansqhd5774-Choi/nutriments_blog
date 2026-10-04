import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import sanitizeHtml from 'sanitize-html';

export const BLOG = 'https://nutriments.tistory.com';
export const BLOG_HOST = 'nutriments.tistory.com';
export const EXPECTED_REPO = 'ansqhd5774-Choi/nutriments_blog';

export function assertMutationUrl(value, { articleOnly = false } = {}) {
  let url;
  try { url = new URL(value); } catch { throw new Error('E_MUTATION_URL'); }
  if (url.protocol !== 'https:' || url.host !== BLOG_HOST || url.origin !== BLOG || url.username || url.password) throw new Error('E_MUTATION_HOST');
  if (articleOnly && (!/^\/\d+$/.test(url.pathname) || url.search || url.hash)) throw new Error('E_ARTICLE_URL');
  return url;
}

export function assertArticleUrl(value) {
  return assertMutationUrl(value, { articleOnly:true }).href;
}

export function textHtml(html) {
  return String(html).replace(/<\/(?:p|h[2-4]|li|tr|blockquote|div)>|<br\s*\/?>/gi, ' ');
}
export function plainText(html) {
  return sanitizeHtml(textHtml(html), { allowedTags: [], allowedAttributes: {} }).replace(/\s+/g, ' ').trim();
}

const allowedPostKeys = ['id','title','category','tags','bodyHtml','representativeImageUrl','status','approved'];
export function assertSafeBodyHtml(bodyHtml) {
  if (typeof bodyHtml !== 'string' || bodyHtml.length > 200000 || !plainText(bodyHtml)) throw new Error('E_BODY');
  if (/REDACTED|\{\{|\}\}|<!--|-->|<\s*(script|iframe|form|input|style|object|embed)\b|\bon\w+\s*=|javascript\s*:|data\s*:|\b(?:src|href)\s*=\s*["']?\s*(?:\/\/|http:)/i.test(bodyHtml)) throw new Error('E_UNSAFE_HTML');
  for (const match of bodyHtml.matchAll(/\b(src|href)\s*=\s*(["'])(.*?)\2/gi)) {
    if (match[1].toLowerCase() === 'href' && match[3].startsWith('#')) continue;
    let url;
    try { url = new URL(match[3]); } catch { throw new Error('E_CONTENT_URL'); }
    if (url.protocol !== 'https:' || url.username || url.password || /[?&](key|token|access_token|api_key)=/i.test(url.search)) throw new Error('E_CONTENT_URL');
  }
  return bodyHtml;
}

export function checkPost(post, filename) {
  if (!post || typeof post !== 'object' || Array.isArray(post) || Object.keys(post).some(k => !allowedPostKeys.includes(k))) throw new Error('E_POST_SCHEMA');
  if (!/^[a-z0-9][a-z0-9-]{2,79}$/.test(post.id || '') || filename !== `${post.id}.json`) throw new Error('E_POST_ID');
  if (typeof post.title !== 'string' || !post.title.trim() || post.title.length > 150 || /[\r\n]/.test(post.title)) throw new Error('E_TITLE');
  if (typeof post.category !== 'string' || !post.category.trim() || post.category.length > 80) throw new Error('E_CATEGORY');
  if (!['draft','ready'].includes(post.status) || typeof post.approved !== 'boolean') throw new Error('E_STATUS');
  if (post.status === 'ready' && !post.approved) throw new Error('E_APPROVAL');
  if (!Array.isArray(post.tags) || post.tags.length > 10 || post.tags.some(t => typeof t !== 'string' || !t.trim() || t.length > 40 || /[,#\r\n]/.test(t))) throw new Error('E_TAGS');
  assertSafeBodyHtml(post.bodyHtml);
  if (post.representativeImageUrl !== undefined) {
    let rep;
    try { rep = new URL(post.representativeImageUrl); } catch { throw new Error('E_REPRESENTATIVE_IMAGE'); }
    if (rep.protocol !== 'https:' || rep.username || rep.password || /[?&](key|token|access_token|api_key)=/i.test(rep.search)) throw new Error('E_REPRESENTATIVE_IMAGE');
  }
  return post;
}

export function checkPublishHtml(post) {
  const clean = sanitizeHtml(post.bodyHtml, {
    allowedTags: ['p','br','h2','h3','h4','strong','em','u','s','ul','ol','li','blockquote','table','thead','tbody','tr','th','td','a','img','hr','span'],
    allowedAttributes: { a:['href','title'], img:['src','alt','width','height'], th:['colspan','rowspan'], td:['colspan','rowspan'] },
    allowedSchemes:['https'], allowProtocolRelative:false,
  });
  const normalize = html => html.replace(/<(img|br|hr)(\b[^>]*?)\s*\/?\s*>/gi,'<$1$2>');
  if (normalize(clean) !== normalize(post.bodyHtml)) throw new Error('E_HTML_REQUIRES_REVIEW');
  return post;
}

export function fingerprint(post) {
  return createHash('sha256').update(JSON.stringify([post.id,post.title,post.category,post.tags,post.bodyHtml,post.representativeImageUrl || null])).digest('hex');
}

export async function loadPosts(directory='posts') {
  const posts=[];
  for (const name of (await readdir(directory)).filter(n=>n.endsWith('.json')).sort()) {
    posts.push(checkPost(JSON.parse(await readFile(`${directory}/${name}`,'utf8')), name));
  }
  if (new Set(posts.map(p=>p.id)).size !== posts.length || new Set(posts.map(p=>p.title)).size !== posts.length) throw new Error('E_DUPLICATE_POST');
  return posts;
}

export function eligible(post,state) {
  if (post.status !== 'ready' || !post.approved) return false;
  if (!state) return true;
  if (state.phase === 'published') return false;
  if (state.phase === 'failed' && state.publicMutationConfirmed === false && state.fingerprint === fingerprint(post)) return true;
  throw new Error('E_EXISTING_PUBLICATION_REQUIRES_REVIEW');
}

export function selectOne(items, code='E_ONE_POST_PER_RUN') {
  if (items.length > 1) throw new Error(code);
  return items[0] || null;
}
