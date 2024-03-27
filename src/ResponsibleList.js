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
}