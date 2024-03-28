import ContractNotifier from '../src/ContractNotifier.js';
import options from '../conf/options.js';

const app = new ContractNotifier(options);

export default (({test, assert}) => {
  test('Get notify person', async () => {
    await app.init();
    const contract_uri = ['d:ro3exnvper7n3032ss7zthvb0k', 'd:uin03ts75ls099q1tnxg7inwyn', 'd:ilex1t240bq2lhs78jwlfrdprv'];
    const res = [];
    for (let i = 0; i < contract_uri.length; i++) {
      res.push(await app.getPersonToNotify(contract_uri[i]));
    }
    console.log(res);
    assert(res[0] == 'cfg:AdministratorAppointment');
    assert(res[1] == 'd:contract_controller_role');
    assert(res[1] == 'd:86166bd9-b657-4396-8bd6-91ee39b63435');
  });
});
