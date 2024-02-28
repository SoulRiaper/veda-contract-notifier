import VedaService from "./VedaService.js";
import { BaseModel } from "veda-client";
import Mustache from "mustache";
 
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

        const contractExecutor = contract["mnd-s:executorSpecialistOfContract"][0]; 
        const contractSupporter = contract["mnd-s:supportSpecialistOfContract"][0];
        const contractManager = contract["mnd-s:ContractManager"][0];
        const contractDep = contract["v-s:responsibleDepartment"][0];

        await contractExecutor.load();
        await contractSupporter.load();
        await contractManager.load();
        await contractDep.load();

        const isExecutorValid = await this.veda.isIndividValid(contractExecutor);
        const isSupporterValid = await this.veda.isIndividValid(contractSupporter);
        const isManagerValid = await this.veda.isIndividValid(contractManager);
        const isDepValid = await this.veda.isIndividValid(contractDep);

        console.log(`Exec ${isExecutorValid}, Dep ${isDepValid}, Supp ${isSupporterValid}, man ${isManagerValid}\n`);

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

    async sendMail (recipient, contractList) {
        const view = {
            app_name: this.veda.getAppName(),
            contract_list: contractList.map(item => this.options.veda.server + "#/" + item + "\n")
        }
        let letter = await this.veda.getMailTemplate("mnd-s:msg-template-notification_not-actual-contract-responsible");
        letter.subject = Mustache.render(letter.subject, view).replace (/&#x2F;/g, '/');
        letter.body = Mustache.render(letter.body, view).replace (/&#x2F;/g, '/');

        const recipientObj = new BaseModel(recipient);
        if (! await this.veda.isIndividValid(recipientObj)) {
            recipient = "d:contract_controller_role";
        }

        console.log(`Mail will send to: ${recipient}`);
        console.log(letter.subject);
        console.log(letter.body);
        const mailObj = this.veda.prepareEmailLetter(recipient, letter);
        await mailObj.save();
        console.log(`Mail sent to, uid: ${mailObj.id}`);
    }

    async getContracts () {
        this.veda.getDocsByQuery();
    }
}