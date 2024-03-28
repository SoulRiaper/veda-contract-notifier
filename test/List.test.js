import {Responsible} from '../src/ResponsiblePerson.js';
import ResponsibleList from '../src/ResponsibleList.js';

export default (({test, assert}) => {
  test('Получаем ответственных определенного типа', () => {
    const responsibles = new ResponsibleList();
    const responsible1 = new Responsible('id-ответственного1');
    responsible1.addResponsibility('Тип ответственности 1', ['Документ 1', 'Документ 2']);
    const responsible2 = new Responsible('id-ответственного2');
    responsible2.addResponsibility('Тип ответственности 2', ['Документ 3', 'Документ 4']);
    responsibles.addResponsible(responsible1);
    responsibles.addResponsible(responsible2);
    const responsiblesWithType = responsibles.getResponsiblesByType('Тип ответственности 1');
    assert.equal(responsiblesWithType.length, 1);
  });
});
