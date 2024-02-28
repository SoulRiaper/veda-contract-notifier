import ContractNotifier from "./src/ContractNotifier.js";
import options from "./conf/options.js"
import log from "./src/log.js"

async function run() {
    log.info("Script starting.");
    const app = new ContractNotifier(options);
    await app.init();

    const contractsUri = await app.getContractsFromStoredQuery();
    log.info("Start sending emails.");
    const toSendList = await app.getToSendList(contractsUri);
    for (let toSendPerson in toSendList) {
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