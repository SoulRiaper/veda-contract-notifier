import VedaService from "./VedaService.js";
import options from "../conf/options.js";

export default class ContractNotifier {

    constructor () {
        this.options = options;
    }

    async init () {
        this.veda = new VedaService(this.options);
        await this.veda.init();
    }

    async getContractByUri (contractUri) {
        try {
            return await this.veda.getByUri(contractUri);
        } catch (error) {
            console.error("Cant fetch data, error with message: ", error.message);
            throw error;            
        }
    }
}