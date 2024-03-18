import VedaService from './VedaService.js';
import {BaseModel} from 'veda-client';
import Mustache from 'mustache';
import log from './log.js';
import sendTelegram from './sendTelegram.js';

export default class ContractNotifier {
  constructor (options) {
    this.options = options;
  }

  async init () {
    this.veda = new VedaService(this.options);
    await this.veda.init();
  }

  async getContractsFromStoredQuery () {
    try {
      return await this.veda.getDocsFromStoredQuery();
    } catch (error) {
      log.error(`Failed to query data: ${error.message}`);
    }
  }

  async getPersonToNotify (contractUri) {
    const contract = new BaseModel(contractUri);
    try {
      await contract.load();
    } catch (error) {
      log.error(contractUri, error.message);
      throw error;
    }

    const isExecutorValid = await this.isContractResponsibleValid(contract, 'mnd-s:executorSpecialistOfContract')
      .catch((error) => {
        log.error(`Failed to check isExecutorValid: ${error.message}`);
        return false;
      });
    const isSupporterValid = await this.isContractResponsibleValid(contract, 'mnd-s:supportSpecialistOfContract')
      .catch((error) => {
        log.error(`Failed to check isSupporterValid: ${error.message}`);
        return false;
      });
    const isManagerValid = await this.isContractResponsibleValid(contract, 'mnd-s:ContractManager')
      .catch((error) => {
        log.error(`Failed to check isManagerValid: ${error.message}`);
        return false;
      });
    const isDepValid = await this.isContractResponsibleValid(contract, 'v-s:responsibleDepartment')
      .catch((error) => {
        log.error(`Failed to check isDepValid: ${error.message}`);
        return false;
      });

    if (!isExecutorValid) {
      if (contract.hasValue('v-s:responsibleDepartment')) {
        try {
          const responsibleDep = contract['v-s:responsibleDepartment'][0];
          await responsibleDep.load();
          const depChief = await this.veda.getChiefUri(responsibleDep);
          if (depChief) {
            const depChiefObj = new BaseModel(depChief);
            if (await this.veda.isIndividValid(depChiefObj)) {
              return depChief;
            }
          }
        } catch (error) {
          log.error(`Failed to handle responsibleDep: ${error.message}`);
        }
      }
      return 'd:contract_controller_role';
    }
    if (!isSupporterValid || !isManagerValid || !isDepValid) {
      return contract['mnd-s:executorSpecialistOfContract'][0].id;
    }
    return 'd:contract_controller_role';
  }

  async isContractResponsibleValid (contract, responsibleProp) {
    try {
      if (contract.hasValue(responsibleProp)) {
        const responsible = contract[responsibleProp][0];
        await responsible.load();
        return await this.veda.isIndividValid(responsible);
      }
      return false;
    } catch (error) {
      console.error(`Failed to validate contract responsible: ${error}`);
      throw error;
    }
  }

  async getToSendList (contractsUri) {
    const error_uris = [];
    const toSend = {};
    for (let i = 0; i < contractsUri.length; i++) {
      log.info(`Try to get responsible for contract: ${contractsUri[i]}`);
      try {
        const personToNotify = await this.getPersonToNotify(contractsUri[i]);
        if (!toSend[personToNotify]) {
          toSend[personToNotify] = [contractsUri[i]];
        } else {
          toSend[personToNotify].push(contractsUri[i]);
        }
      } catch (error) {
        log.error(`Cant calculate person to notify CONTRACT: ${contractsUri[i]}`);
        error_uris.push(contractsUri[i]);
        continue;
      }
      log.info(`Get responsible for: ${contractsUri[i]}`);
    }
    if (error_uris != []) {
      await sendTelegram('Cant find responsible for this contracts:', error_uris.join('\n'));
    }

    return toSend;
  }

  async sendMail (recipient, contractList) {
    const view = {
      app_name: this.veda.getAppName(),
      contract_list: contractList.map((item) => this.options.veda.server + '#/' + item).join('\n'),
    };
    const letter = await this.veda.getMailLetterView(this.options.veda.mail.template);
    letter.subject = Mustache.render(letter.subject, view).replace(/&#x2F;/g, '/');
    letter.body = Mustache.render(letter.body, view).replace(/&#x2F;/g, '/');

    const recipientObj = new BaseModel(recipient);
    if (! await this.veda.isIndividValid(recipientObj)) {
      recipient = 'd:contract_controller_role';
    }

    const mailObj = this.veda.prepareEmailLetter(recipient, letter);
    await mailObj.save();
    log.info(`Mail send to: ${recipient}. Email obj uri: ${mailObj.id}`);
  }
}
