import ContractNotifier from "./src/ContractNotifier.js";
import options from "./conf/options.js"
import log from "./src/log.js"

async function run() {
    log.info("Script starting.");
    const app = new ContractNotifier(options);
    await app.init();
    
    const contractsQueryResult = await app.getContractsFromStoredQuery();

    const toSendList = await app.getToSendList(contractsQueryResult.result);
    for (let toSendPerson in toSendList) {
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
    log.info("Script end work.");
}

await run();
process.exit(0);