export default class ResponsibleList {

    constructor (responsibles) {
        if (!Array.isArray(responsibles)) {
            responsibles = responsibles ? [responsibles] : []; 
        }
        this.responsibles = responsibles;
    }

    addResponsible(newResponsible) {
        let existingResponsible = this.responsibles.find(responsible => responsible.id === newResponsible.id)
    
        if (existingResponsible) {
            newResponsible.responsibilities.forEach(newResp => {
                existingResponsible.addResponsibility(newResp.type, newResp.documents);
            });
        } else {
          this.responsibles.push(newResponsible);
        }
    }

    getResponsiblesByType(type) {
        return this.responsibles.filter( resp => {
            return resp.responsibilities.some(item => item.type === type)
        }).map( resp => {
            const responsibility = resp.responsibilities.find(item => item.type === type)
            return {id : resp.id, documents: responsibility.documents}
        });
    }
    
    getResponsibles() {
        return this.responsibles.map( resp => {
            return resp.responsibilities.map( item => {
                return { id: resp.id, type: item.type, documents: item.documents };
            })
        }).flat();
    }
}