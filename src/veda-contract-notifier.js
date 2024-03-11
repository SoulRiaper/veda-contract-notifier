import ContractNotifier from './ContractNotifier.js';
import options from '../conf/options.js';
import log from './log.js';

async function run () {
  log.info('Script starting.');
  const app = new ContractNotifier(options);
  await app.init();

  const contractsQueryResult = await app.getContractsFromStoredQuery()
    .catch( (error) => {
      log.error(`Critical query error: ${error.message}. Exit.`);
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
    }
  }
  log.info('Script end work.');
}

await run();
process.exit(0);
