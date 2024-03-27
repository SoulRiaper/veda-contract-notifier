export class Responsible {

  constructor(id, responsibilities) {
    this.id = id;
    if (responsibilities && !Array.isArray(responsibilities)) {
      responsibilities = [responsibilities];
    }
    this.responsibilities = responsibilities ? responsibilities : [];
  }

  // добавить тип ответственности и соответствующие документы
  addResponsibility(type, documents) {
    if (!Array.isArray(documents)) {
      documents = [documents];
    }

    const existingResponsibility = this.responsibilities.find((responsibility) => responsibility.type === type);

    if (existingResponsibility) {
      existingResponsibility.documents.push(...documents);
    } else {
      this.responsibilities.push(new Responsibility(type, documents));
    }
  }

  // метод для добавления документов в существующий тип ответственности
  addDocuments(type, newDocuments) {
    this.responsibilities.forEach((responsibility) => {
      if (responsibility.type === type) {
        responsibility.documents.push(...newDocuments);
      }
    });
  }

  // метод для получения всех документов определенного типа ответственности
  getDocuments(type) {
    let documents = [];
    this.responsibilities.forEach((responsibility) => {
      if (responsibility.type === type) {
        documents.push(...responsibility.documents);
      }
    });
    return documents;
  }

}

export class Responsibility {
  constructor(type, documents) {
    this.type = type;
    if (!Array.isArray(documents)) {
      documents = [documents];
    }
    this.documents = documents;
  }
}