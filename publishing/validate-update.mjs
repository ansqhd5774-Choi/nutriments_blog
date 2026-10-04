import { loadUpdates, eligibleUpdate } from './update-core.mjs';
import { UpdateLedger } from './update-ledger.mjs';
import { renderEditorialPost, EDITORIAL_TEMPLATE_VERSION } from './editorial.mjs';
try{
  const updates=await loadUpdates(); const ledger=new UpdateLedger(); let pending=0;
  for(const update of updates){const state=await ledger.read(update.id);if(eligibleUpdate(update,state)){renderEditorialPost(update);pending++;}}
  if(pending>1) throw new Error('E_ONE_UPDATE_PER_RUN');
  console.log(`PASS_UPDATE_SOURCE: ${updates.length} updates validated; ${pending} pending; editorial=${EDITORIAL_TEMPLATE_VERSION}.`);
}catch(error){const code=/^E_[A-Z_]+$/.test(error?.message??'')?error.message:'E_UPDATE_VALIDATE_RUNTIME';console.error(`FAIL_UPDATE_SOURCE: ${code}`);process.exitCode=1;}
