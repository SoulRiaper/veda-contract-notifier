import { Backend, BaseModel, Model } from "veda-client";
import * as util from "./Util.js";

export default class VedaService {

    constructor (options) {
        this.options = options;
    }

    async init () {
        try{
            Backend.init(this.options.veda.server);
            const authInfo = await this.authenticate();
            console.log('Veda user authentication success:', this.options.veda.user);
            console.log('Ticket will expire at:', new Date(authInfo.expires).toISOString());
            setInterval(this.#refreshTicket.bind(this), (authInfo.expires - Date.now()) * 0.9);
        } catch (error) {
          console.log('Veda user authentication error:', error.message);
          console.log(error);
          throw error;
        }
    }

    async #refreshTicket () {
        try {
          const authInfo = await this.authenticate();
          console.log('Veda ticket refreshed for user:', this.options.veda.user);
          console.log('Ticket will expire at:', new Date(authInfo.expires).toISOString());
        } catch (error) {
          console.error('Veda ticket refresh error:', error.message);
          console.log(error);
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

    async getChiefUri(department,depth){
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
}