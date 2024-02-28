import VedaService from "./VedaService.js";
import { BaseModel } from "veda-client";
import Mustache from "mustache";
import log from "./log.js"
 
export default class ContractNotifier {

    constructor (options) {
        this.options = options;
    }

    async init () {
        this.veda = new VedaService(this.options);
        await this.veda.init();
    }

    async getContractsFromStoredQuery () {
        return ["d:hi0hb9q1zvafkbv4ice02p6n86"];
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
        let letter = await this.veda.getMailLetterView(this.options.veda.mail.template);
        letter.subject = Mustache.render(letter.subject, view).replace (/&#x2F;/g, '/');
        letter.body = Mustache.render(letter.body, view).replace (/&#x2F;/g, '/');

        const recipientObj = new BaseModel(recipient);
        if (! await this.veda.isIndividValid(recipientObj)) {
            recipient = "d:contract_controller_role";
        }

        const mailObj = this.veda.prepareEmailLetter(recipient, letter);
        await mailObj.save();
        log.info(`Mail will send to: ${recipient}. Email obj uri: ${mailObj.id}`);
    }

    async getToSendList (contractsUri) {
        let toSend = {};
        for(let i = 0; i < contractsUri.length; i++){
            try {
                const personToNotify = await this.getPersonToNotify(contractsUri[i]);
                if (!toSend[personToNotify]) {
                    toSend[personToNotify] = [contractsUri[i]];
                } else {
                    toSend[personToNotify].push(contractsUri[i]);
                }
            } catch (error) {
                log.error(`Cant calculate person to notify to: ${contractsUri[i]}`);
                throw error
            }
        }
        return toSend;
    }

    async getContracts () {
        this.veda.getDocsByQuery();
    }
}