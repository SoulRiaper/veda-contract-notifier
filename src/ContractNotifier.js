import VedaService from './VedaService.js';
import {BaseModel} from 'veda-client';
import Mustache from 'mustache';
import log from './log.js';
import sendTelegram from './sendTelegram.js';
import {Responsible, Responsibility} from './ResponsiblePerson.js';
import ResponsibleList from './ResponsibleList.js';

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

  async getResponsiblePerson (contractUri) {
    const contract = new BaseModel(contractUri);
    try {
      await contract.load();
    } catch (error) {
      log.error(contractUri, error.message);
      throw error;
    }

    const executorPropUri = 'mnd-s:executorSpecialistOfContract';
    const supporterPropUri = 'mnd-s:supportSpecialistOfContract';
    const managerPropUri = 'mnd-s:ContractManager';
    const depPropUri = 'v-s:responsibleDepartment';
    const controllerRespType = 'controller';

    const isExecutorValid = await this.isContractResponsibleValid(contract, executorPropUri)
      .catch((error) => {
        log.error(`Failed to check isExecutorValid: ${error.message}`);
        return false;
      });
    const isSupporterValid = await this.isContractResponsibleValid(contract, supporterPropUri)
      .catch((error) => {
        log.error(`Failed to check isSupporterValid: ${error.message}`);
        return false;
      });
    const isManagerValid = await this.isContractResponsibleValid(contract, managerPropUri)
      .catch((error) => {
        log.error(`Failed to check isManagerValid: ${error.message}`);
        return false;
      });
    const isDepValid = await this.isContractResponsibleValid(contract, depPropUri)
      .catch((error) => {
        log.error(`Failed to check isDepValid: ${error.message}`);
        return false;
      });

    if (!isExecutorValid) {
      if (contract.hasValue(depPropUri)) {
        try {
          const responsibleDep = contract[depPropUri][0];
          await responsibleDep.load();
          if (! await this.veda.isIndividValid(responsibleDep)) {
            return new Responsible('d:contract_controller_role', new Responsibility(controllerRespType, contractUri));
          }
          const depChief = await this.veda.getChiefDetailUri(responsibleDep);
          if (depChief) {
            const depChiefObj = new BaseModel(depChief);
            if (await this.veda.isIndividValid(depChiefObj)) {
              return new Responsible(depChief, new Responsibility(depPropUri, contractUri));
            }
          }
        } catch (error) {
          log.error(`Failed to handle responsibleDep: ${error.message}`);
        }
      }
      return new Responsible('d:contract_controller_role', new Responsibility(controllerRespType, contractUri));
    }
    if (!isSupporterValid || !isManagerValid || !isDepValid) {
      return new Responsible(contract[executorPropUri][0].id, new Responsibility(executorPropUri, contractUri));
    }
    return new Responsible('d:contract_controller_role', new Responsibility(controllerRespType, contractUri));
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
      log.error(`Failed to validate contract responsible: ${error}`);
      throw error;
    }
  }

  async getResponsiblesList (contractsUri) {
    const error_uris = [];
    const responsibleList = new ResponsibleList();
    for (let i = 0; i < contractsUri.length; i++) {
      try {
        const responsible = await this.getResponsiblePerson(contractsUri[i]);
        responsibleList.addResponsible(responsible);
      } catch (error) {
        log.error(`Cant calculate person to notify CONTRACT: ${contractsUri[i]}, send it to controller`);
        error_uris.push(contractsUri[i]);
        responsibleList.addResponsible(new Responsible('d:contract_controller_role', new Responsibility('controller', contractsUri[i])));
        continue;
      }
      log.info(`Get responsible for: ${contractsUri[i]}`);
    }
    if (error_uris != []) {
      log.error('Cant find responsible for this contracts, send it to controller:', error_uris.join('\n'));
      await sendTelegram('Cant find responsible for this contracts, send it to controller:', error_uris.join('\n'));
    }

    return responsibleList;
  }

  async sendMail (responsible) {
    const view = {
      app_name: 'Optiflow',
      contract_list: responsible.documents.map((item) => this.options.veda.server + '#/' + item).join('\n'),
    };
    const letter = await this.getMailLetterByRespType(responsible.type);
    letter.subject = Mustache.render(letter.subject, view).replace(/&#x2F;/g, '/');
    letter.body = Mustache.render(letter.body, view).replace(/&#x2F;/g, '/');

    const mailObj = this.veda.prepareEmailLetter(responsible.id, letter);

    log.info(`Mail send to: ${responsible.id}. Email obj uri: ${mailObj.id}`);
    log.info(mailObj['v-s:messageBody']);
  }
  // await mailObj.save();

  async getMailLetterByRespType (type) {
    try {
      if (type === 'mnd-s:executorSpecialistOfContract') {
        return await this.veda.getMailLetterView(this.options.veda.mail.template + '-for-executor');
      }
      if (type === 'v-s:responsibleDepartment') {
        return await this.veda.getMailLetterView(this.options.veda.mail.template + '-for-dep-chief');
      }
      if (type === 'controller') {
        return await this.veda.getMailLetterView(this.options.veda.mail.template + '-for-dep-controller');
      }
    } catch (e) {
      log.error('Cant get message template. Error message: ', e.message);
    }
  }
}
