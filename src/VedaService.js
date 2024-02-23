import { Backend } from "veda-client";

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
}