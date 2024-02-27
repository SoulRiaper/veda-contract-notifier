import VedaService from "./VedaService.js";
import { BaseModel } from "veda-client";

export default class ContractNotifier {

    constructor (options) {
        this.options = options;
    }

    async init () {
        this.veda = new VedaService(this.options);
        await this.veda.init();
    }

    async getContractsFromStoredQuery () {
        return await [this.veda.getDocsFromStoredQuery()];
        // try {
        //     return await this.veda.getDocsFromStoredQuery("v-s:contract-unvalid-responsibles");
        // } catch (error) {
        //     console.error("Cant fetch data, error with message: ", error.message);
        //     throw error;
        // }
    }

    async getPersonToNotify (contractUri) {
        const contract = new BaseModel(contractUri);
        await contract.load();

        const contractExecutor = new BaseModel(contract["mnd-s:executorSpecialistOfContract"][0].id); 
        const contractSupporter = new BaseModel(contract["mnd-s:supportSpecialistOfContract"][0].id);
        const contractManager = new BaseModel(contract["mnd-s:ContractManager"][0].id);
        const contractDep = new BaseModel(contract["v-s:responsibleDepartment"][0].id);

        await contractExecutor.load();
        await contractManager.load();
        await contractManager.load();

        const isExecutorValid = contractExecutor.hasValue("v-s:valid", true) && ! contractExecutor.hasValue('v-s:deleted', true);
        const isSupporterValid = contractSupporter.hasValue("v-s:valid", true) && ! contractExecutor.hasValue('v-s:deleted', true);
        const isManagerValid = contractManager.hasValue("v-s:valid", true) && ! contractExecutor.hasValue('v-s:deleted', true);
        const isDepValid = contractDep.hasValue("v-s:valid", true) && ! contractExecutor.hasValue('v-s:deleted', true);

        console.log(`Exec ${isExecutorValid}, Dep ${isDepValid}, Supp ${isSupporterValid}, man ${isManagerValid}`);

        if (!isExecutorValid) {
            if (contract.hasValue("v-s:responsibleDepartment")) {
                const responsibleDep = contract["v-s:responsibleDepartment"][0];
                await responsibleDep.load();
                const depChief = await this.veda.getChiefUri(responsibleDep);
                return depChief? depChief : "d:contract_controller_role"
            } else {
                return "d:contract_controller_role";
            }
        }
        if (!isSupporterValid || !isManagerValid || !isDepValid) {
            return contractExecutor.id;
        }
    }
}