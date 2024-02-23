import ContractNotifier from "./src/ContractNotifier.js";

const app = new ContractNotifier();
await app.init();
console.log(await app.getContractByUri("td:RomanKarpov-Analyst1"));