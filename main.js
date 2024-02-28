import ContractNotifier from "./src/ContractNotifier.js";
import options from "./conf/options.js"

async function run() {
    const app = new ContractNotifier(options);
    await app.init();
    const contractTestUri = "d:hi0hb9q1zvafkbv4ice02p6n86";
    const personsToNotify = await app.getPersonToNotify(contractTestUri);
    await app.sendMail(personsToNotify, [contractTestUri]);
}

run();