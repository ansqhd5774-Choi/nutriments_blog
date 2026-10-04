import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { renderEditorialPost, editorialExpectations } from '../publishing/editorial.mjs';
import { parse } from 'yaml';
import { checkUpdateSource, eligibleUpdate, updateFingerprint } from '../publishing/update-core.mjs';
const u={id:'update-4-probiotics-20261004',articleId:'4',targetUrl:'https://nutriments.tistory.com/4',expectedCurrentTitle:'기존 제목',title:'새 제목',representativeImageUrl:'https://example.org/a.jpg',bodyHtml:'<p>본문</p>',status:'ready',approved:true};
test('update is locked to same numeric Nutriments URL',()=>{assert.equal(checkUpdateSource(u,u.id+'.json').articleId,'4');for(const targetUrl of ['https://nutriments.tistory.com/5','https://nhunnhun.tistory.com/4','https://nutriments.tistory.com/manage'])assert.throws(()=>checkUpdateSource({...u,targetUrl},u.id+'.json'),/E_UPDATE_URL/);});

test('update body rejects template residue and unsafe URLs',()=>{for(const bodyHtml of ['<p>{{placeholder}}</p>','<a href="javascript:alert(1)">x</a>','<img src="http://example.org/a.jpg" alt="a">'])assert.throws(()=>checkUpdateSource({...u,bodyHtml},u.id+'.json'));});
test('updated fingerprint is skipped and submitting blocks retry',()=>{const fp=updateFingerprint(u);assert.equal(eligibleUpdate(u,{phase:'updated',fingerprint:fp,url:u.targetUrl}),false);assert.throws(()=>eligibleUpdate(u,{phase:'submitting',fingerprint:fp,url:u.targetUrl}),/E_UPDATE_EXISTING_STATE_REQUIRES_REVIEW/);});
test('update workflow is isolated and Windows CMD only',()=>{const w=parse(readFileSync(new URL('../.github/workflows/update-posts.yml',import.meta.url),'utf8'));assert.deepEqual(w.jobs.update['runs-on'],['self-hosted','windows','x64','nutriments-publisher']);assert.deepEqual(w.jobs.update.defaults,{run:{shell:'cmd'}});assert.equal(w.jobs.update.if,"vars.NUTRIMENTS_TISTORY_ENABLED == 'true' && github.ref == 'refs/heads/main'");assert.equal(w.jobs.update.concurrency.group,'nutriments-tistory-mutation');const paths=w.on?.push?.paths??w['on'].push.paths;assert.ok(paths.includes('updates/**'));assert.ok(!paths.includes('posts/**'));assert.ok(!paths.includes('publishing/publish.mjs'));assert.ok(!paths.includes('publishing/**'));assert.doesNotMatch(JSON.stringify(w),/powershell|pwsh|BROWSERBASE_/i);});
test('update runtime checkpoints before irreversible submit',()=>{const s=readFileSync(new URL('../publishing/update.mjs',import.meta.url),'utf8');assert.match(s,/assertSourceCurrent\(\)/);assert.match(s,/assertRemoteMain\(checkpointCommit/);assert.ok(s.indexOf("phase:'submitting'")<s.indexOf("stage='final-submit'"));assert.match(s,/beforeNumericUrls/);assert.match(s,/addedNumericUrls/);assert.match(s,/E_UPDATE_TARGET_NOT_LISTED/);assert.match(s,/E_UPDATE_CREATED_NEW_URL/);});

test('prepared /4 modernization source satisfies the full R3 authoring contract',()=>{
  const source=JSON.parse(readFileSync(new URL('../updates/update-4-probiotics-20261004.json',import.meta.url),'utf8'));
  assert.equal(source.articleId,'4');
  assert.equal(source.targetUrl,'https://nutriments.tistory.com/4');
  const rendered=renderEditorialPost(source);
  const expected=editorialExpectations(source.bodyHtml);
  assert.equal(expected.images,3);
  assert.equal(expected.faq,3);
  assert.equal(expected.latest,1);
  assert.equal(expected.relatedLinks,3);
  assert.equal((rendered.match(/loading="eager"/g)||[]).length,1);
  assert.equal((rendered.match(/loading="lazy"/g)||[]).length,2);
  assert.equal((rendered.match(/>Q\.<\/span>/g)||[]).length,3);
  assert.equal((rendered.match(/text-decoration:none/g)||[]).length,3);
});
