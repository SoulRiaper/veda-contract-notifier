import { Backend, BaseModel, Model } from "veda-client";
import log from "./log.js"

export default class VedaService {

    constructor (options) {
        this.options = options;
    }

    async init () {
        try{
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

    async getByUri(uri) {
        return await Backend.get_individual(uri);
    }

    async authenticate () {
        return await Backend.authenticate(this.options.veda.user, this.options.veda.password);
    }

    async getDocsFromStoredQuery (query, params) {
        return await this.getByUri("d:hi0hb9q1zvafkbv4ice02p6n86");

    //   if (!params) {
    //     params = new Model();
    //     params["rdf:type"] = util.newUri("v-s:QueryParams");
    //     params["v-s:resultFormat"] = util.newString("full");
    //   }
    //   params["v-s:storedQuery"] = util.newUri(query);
    //   return await Backend.stored_query(JSON.stringify(["v-s:QueryParams", query, "full"]));
    // }
    }

    async getChiefUri (department,depth) {
        depth = depth || 0;
        if ( department ) {
            if ( depth > 15 ) return undefined;
            if ( department["v-s:hasChief"] ) return department["v-s:hasChief"][0].id;
            if ( department["v-s:parentUnit"] ) {
            const dep = department['v-s:parentUnit'][0]
            dep.load();
            return this.getChiefUri(dep, depth + 1);
            };
        };
        return undefined;
    }

    async getMailLetterView (templateUri) {
        let result = {};
        const mailTemplateObj = await Backend.get_individual(templateUri);
        result["subject"] = mailTemplateObj["v-s:notificationSubject"][0].data;
        result["body"] = mailTemplateObj["v-s:notificationBody"][0].data;
        return result;
    }

    async isIndividValid (individ) {
        await individ.load();
        if (individ.hasValue("v-s:valid") && individ.hasValue('v-s:deleted')) {
            return individ.hasValue("v-s:valid", true) && individ.hasValue('v-s:deleted', false);
        }
        if (individ.hasValue("v-s:valid")) {
            return individ.hasValue("v-s:valid", true);
        }
        if (individ.hasValue('v-s:deleted')) {
            return individ.hasValue('v-s:deleted', false);
        }
        return true;
    }

    prepareEmailLetter (recipient, letterView) {
        const letter = new BaseModel();
        letter.addValue('rdf:type', "v-s:Email");
        letter.addValue("v-wf:to", recipient);
        letter.addValue("v-wf:from", this.options.veda.mail.senderAppointment);
        letter.addValue("v-s:subject", letterView.subject);
        letter.addValue("v-s:messageBody", letterView.body);
        letter.addValue("v-s:hasMessageType", "v-s:OtherNotification");
        letter.addValue("v-s:origin", "contract-notifier");
        letter.addValue("v-s:created", new Date());
        letter.addValue("v-s:creator", this.options.veda.mail.senderAppointment);
        return letter;
    }

    #appName = "Optiflow";
    getAppName () {
      return this.#appName;
    }
    
}