import ContractNotifier from './ContractNotifier.js';
import options from '../conf/options.js';
import log from './log.js';

async function run () {
  const app = new ContractNotifier(options);
  try {
    await app.init();
    log.info('Service started.');
    await sendTelegram('🟢 Service started');
  } catch (error) {
    log.error('Service start error:', error.message);
    await sendTelegram('🔴 Service start error:', error.message);
    throw error;
  }

  const contractsQueryResult = await app.getContractsFromStoredQuery()
    .catch( async (error) => {
      log.error(`Critical query error: ${error.message}. Exit.`);
      await sendTelegram('🔴 Service critical query error:', error.message);
    });

  const toSendList = await app.getToSendList(contractsQueryResult.result);
  for (const toSendPerson in toSendList) {
    if (!toSendPerson) {
      continue;
    }
    try {
      await app.sendMail(toSendPerson, toSendList[toSendPerson]);
    } catch (error) {
      log.error(`Cant send email for: ${toSendPerson}.`);
      log.error(error.message);
      await sendTelegram(`🟠 Service error: cant send email for: ${toSendPerson}. Error message: ${error.message}`);
    }
  }
  log.info('Script end work.');
  await sendTelegram('🔴 Service stopped');
}

await run();
process.exit(0);
