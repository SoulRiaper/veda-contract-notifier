import ContractNotifier from "./src/ContractNotifier.js";
import options from "./conf/options.js"

const app = new ContractNotifier(options);
await app.init();
console.log(await app.getPersonToNotify("d:hi0hb9q1zvafkbv4ice02p6n86"));