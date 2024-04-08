import ContractNotifier from './ContractNotifier.js';
import options from '../conf/options.js';
import log from './log.js';
import sendTelegram from './sendTelegram.js';

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
  log.info(`Get ${contractsQueryResult.result.length} contracts url.`);
  const responsibleList = await app.getResponsiblesList(contractsQueryResult.result);
  const toSendList = responsibleList.getResponsibles();

  for (const resp of toSendList) {
    try {
      await app.sendMail(resp);
    } catch (error) {
      log.error(`Cant send email for: ${resp}.`);
      log.error(error.message);
      await sendTelegram(`🟠 Service error: cant send email for: ${resp}. Error message: ${error.message}`);
    }
  }
  log.info(`Mail count: ${toSendList.length}; Responsibles count: ${responsibleList.responsibles.length}`);
  log.info('Script end work.');
  await sendTelegram('🔴 Service stopped');
}

await run();
process.exit(0);
