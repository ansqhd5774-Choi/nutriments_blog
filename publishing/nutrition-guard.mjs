const PRIORITY_HOSTS = [
  'ods.od.nih.gov','who.int','www.who.int','fda.gov','www.fda.gov','efsa.europa.eu','www.efsa.europa.eu',
  'mfds.go.kr','www.mfds.go.kr','kdca.go.kr','www.kdca.go.kr','fdc.nal.usda.gov','pubmed.ncbi.nlm.nih.gov','doi.org'
];
function sourceLinks(html){
  const block=html.match(/<h2>자료 출처<\/h2>\s*<ul>([\s\S]*?)<\/ul>/i)?.[1] || '';
  return [...block.matchAll(/<a\b[^>]*href=(["'])(https:\/\/[^"']+)\1/gi)].map(x=>x[2]);
}
export function assertNutritionEvidence(post){
  const links=[...new Set(sourceLinks(post.bodyHtml))];
  if (links.length < 2) throw new Error('E_NUTRITION_EVIDENCE_MINIMUM');
  if (!links.some(link=>PRIORITY_HOSTS.includes(new URL(link).host.toLowerCase()))) throw new Error('E_NUTRITION_PRIORITY_SOURCE_REQUIRED');
  if (/\b(?:완치|치료한다|100%\s*예방|반드시\s*예방|기적의|만병통치)\b/i.test(post.bodyHtml)) throw new Error('E_NUTRITION_OVERCLAIM');
  if (/권장량\s*:\s*[^<]{0,60}(?:RDA|AI)[^<]{0,30}(?:UL|상한)/i.test(post.bodyHtml)) throw new Error('E_NUTRITION_REFERENCE_MIXED');
  return post;
}
