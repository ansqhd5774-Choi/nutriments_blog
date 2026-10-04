import { access, mkdir, realpath, stat } from 'node:fs/promises';
import { constants } from 'node:fs';
import { isAbsolute, resolve, relative, win32 } from 'node:path';
import { execFileSync } from 'node:child_process';
import { chromium } from 'playwright-core';

function isAbsolutePortable(value) { return typeof value==='string' && (isAbsolute(value) || /^[A-Za-z]:[\\/]/.test(value)); }

export function assertDedicatedProfile(profileDir, repositoryDir=process.cwd()) {
  if (!profileDir || !isAbsolutePortable(profileDir)) throw new Error('E_LOCAL_PROFILE_REQUIRED');
  const normalized=String(profileDir).replaceAll('\\','/').toLowerCase();
  if (normalized.includes('/google/chrome/user data') || /\/default(?:\/|$)/.test(normalized)) throw new Error('E_LOCAL_PROFILE_REQUIRED');
  if (!normalized.includes('nutriments') || normalized.includes('nhunnhun')) throw new Error('E_PROFILE_NOT_ISOLATED');
  const paths = /^[A-Za-z]:[\\/]/.test(profileDir) ? win32 : { resolve, relative, isAbsolute };
  const fromRepo = paths.relative(paths.resolve(repositoryDir), paths.resolve(profileDir));
  if (!fromRepo || (!paths.isAbsolute(fromRepo) && fromRepo !== '..' && !fromRepo.startsWith('..\\') && !fromRepo.startsWith('../'))) throw new Error('E_PROFILE_NOT_ISOLATED');
}

export async function localBrowserConfig(env=process.env) {
  const chromePath=env.TISTORY_CHROME_PATH;
  const profileDir=env.TISTORY_PROFILE_DIR;
  if (!chromePath || !isAbsolute(chromePath)) throw new Error('E_LOCAL_CHROME_REQUIRED');
  try { await access(chromePath,constants.R_OK); if (!(await stat(chromePath)).isFile()) throw new Error(); }
  catch { throw new Error('E_LOCAL_CHROME_REQUIRED'); }
  assertDedicatedProfile(profileDir);
  try {
    await mkdir(profileDir,{recursive:true});
    const actual=await realpath(profileDir);
    assertDedicatedProfile(actual);
    await access(actual,constants.R_OK|constants.W_OK);
    if (!(await stat(actual)).isDirectory()) throw new Error();
  } catch(error) {
    if (/^E_(?:LOCAL_PROFILE_REQUIRED|PROFILE_NOT_ISOLATED)$/.test(error?.message||'')) throw error;
    throw new Error('E_LOCAL_PROFILE_ACCESS');
  }
  return {chromePath:resolve(chromePath),profileDir:resolve(profileDir)};
}

export function assertLocalGit(run=execFileSync) {
  try { run('git',['--version'],{encoding:'utf8',stdio:'pipe',windowsHide:true}); }
  catch { throw new Error('E_LOCAL_GIT_REQUIRED'); }
}

export async function openEditorContext(config,{headless=true,engine=chromium}={}) {
  try { return await engine.launchPersistentContext(config.profileDir,{headless,executablePath:config.chromePath,args:['--restore-last-session']}); }
  catch { throw new Error('E_LOCAL_BROWSER_LAUNCH'); }
}
export async function openPublicBrowser(config,engine=chromium) {
  try { return await engine.launch({headless:true,executablePath:config.chromePath}); }
  catch { throw new Error('E_LOCAL_PUBLIC_BROWSER_LAUNCH'); }
}
