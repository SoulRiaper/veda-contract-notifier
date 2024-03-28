import {Responsible} from '../src/ResponsiblePerson.js';

export default (({test, assert}) => {
  test('Добавляем зоны ответственности и документы', () => {
    const responsible = new Responsible('id-ответственного');
    responsible.addResponsibility('Тип ответственности', ['Документ 1', 'Документ 2']);
    assert(responsible.responsibilities.length === 1);
  });

  test('Добавляем дополнительные документы одного типа', () => {
    const responsible = new Responsible('id-ответственного');
    responsible.addResponsibility('Тип ответственности', ['Документ 1']);
    responsible.addResponsibility('Тип ответственности', ['Документ 2']);
    assert(responsible.responsibilities.length === 1);
    assert(responsible.responsibilities[0].documents.length === 2);
  });
});
