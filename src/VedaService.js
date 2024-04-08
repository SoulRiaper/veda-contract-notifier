import {Backend, BaseModel} from 'veda-client';
import log from './log.js';

export default class VedaService {
  constructor (options) {
    this.options = options;
  }

  async init () {
    try {
      Backend.init(this.options.veda.server);
      const authInfo = await this.authenticate();
      log.info('Veda user authentication success:', this.options.veda.user);
      log.info('Ticket will expire at:', new Date(authInfo.expires).toISOString());
      setInterval(this.#refreshTicket.bind(this), (authInfo.expires - Date.now()) * 0.9);
    } catch (error) {
      log.error('Veda user authentication error:', error.message);
      log.debug(error);
      throw error;
    }
  }

  async #refreshTicket () {
    try {
      const authInfo = await this.authenticate();
      log.info('Veda ticket refreshed for user:', this.options.veda.user);
      log.info('Ticket will expire at:', new Date(authInfo.expires).toISOString());
    } catch (error) {
      console.error('Veda ticket refresh error:', error.message);
      log.error(error);
      await timeout();
      await this.#refreshTicket();
    }
  }

  async authenticate () {
    return await Backend.authenticate(this.options.veda.user, this.options.veda.password);
  }

  async getDocsFromStoredQuery () {
    return await Backend.query({
      from: 0,
      top: 10000,
      limit: 10000,
      sql: `
              select distinct t1.id
              from veda_tt."mnd-s:Contract" t1 final
                left join veda_tt."v-s:Appointment" t2 final on t2.id=t1.mnd_s_ContractManager_str[1]
                left join veda_tt."v-s:Appointment" t3 final on t3.id=t1.mnd_s_executorSpecialistOfContract_str[1]
                left join veda_tt."v-s:Appointment" t4 final on t4.id=t1.mnd_s_supportSpecialistOfContract_str[1]
                left join veda_tt."v-s:Department" t5 final on t5.id=t1.v_s_responsibleDepartment_str[1]
              where t1.mnd_s_isContractClosed_int = [0]
               and length(t1.v_s_hasRegistrationRecord_str)>0 and t1.v_s_hasRegistrationRecord_str != ['']
               and t1.v_s_deleted_int = [0]
               and (t2.v_s_deleted_int=[1] or t3.v_s_deleted_int=[1] or t4.v_s_deleted_int=[1] or t5.v_s_deleted_int=[1])
              `,
    });
  }

  async getChiefDetailUri (department, depth) {
    depth = depth || 0;
    if ( department ) {
      if ( depth > 15 ) return undefined;
      if ( department['v-s:hasChiefDetail'] ) return department['v-s:hasChiefDetail'][0].id;
      if ( department['v-s:parentUnit'] ) {
        const dep = department['v-s:parentUnit'][0];
        dep.load();
        return this.getChiefDetailUri(dep, depth + 1);
      };
    };
    return undefined;
  }

  async isIndividValid (individ) {
    await individ.load();
    return ! individ.hasValue('v-s:deleted', true);
  }

  async getMailLetterView (templateUri) {
    const result = {};
    const mailTemplateObj = await Backend.get_individual(templateUri);
    result['subject'] = mailTemplateObj['v-s:notificationSubject'][0].data;
    result['body'] = mailTemplateObj['v-s:notificationBody'][0].data;
    return result;
  }

  prepareEmailLetter (recipient, letterView) {
    const letter = new BaseModel();
    letter.addValue('rdf:type', 'v-s:Email');
    letter.addValue('v-wf:to', recipient);
    letter.addValue('v-wf:from', this.options.veda.mail.senderAppointment);
    letter.addValue('v-s:subject', letterView.subject);
    letter.addValue('v-s:messageBody', letterView.body);
    letter.addValue('v-s:hasMessageType', 'v-s:OtherNotification');
    letter.addValue('v-s:origin', 'contract-notifier');
    letter.addValue('v-s:created', new Date());
    letter.addValue('v-s:creator', this.options.veda.mail.senderAppointment);
    return letter;
  }

  #appName = 'Optiflow';
  getAppName () {
    return this.#appName;
  }
}
