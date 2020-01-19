
const index = require('../lib/index');
const initFlow = require('../lib/init');

jest.mock('debug', () => jest.fn(() => 'debug'));
jest.mock('../lib/init', () => jest.fn(() => []));
jest.mock('@codeinkit/flows', () => ({
  Flows: jest.fn(() => {
    const obj = {
      execute: jest.fn(() => obj),
      hook: jest.fn(),
      register: jest.fn()
    };

    return obj;
  })
}));

describe('index', () => {
  beforeEach(() => {

  })

  test('init should execute initFlows init with the runFlow', async () => {
    const config = {};
    const flows = await index.init('dirname', config);
    
    expect(flows.hook).toBeCalledTimes(2);
    expect(flows.hook).toBeCalledWith('pre_action', 'debug');
    expect(flows.hook).toBeCalledWith('post_action', 'debug');
    expect(flows.register).toBeCalledTimes(1);
    expect(flows.register).toBeCalledWith('init', initFlow);
    expect(flows.execute).toBeCalledTimes(1);
    expect(flows.execute).toBeCalledWith('init', config, expect.objectContaining({flows: {
      execute: expect.anything(),
      hook: expect.anything(),
      register: expect.anything()
    }}));
    expect(config).toMatchObject({
      flowsPath: 'dirname/flows/',
      setupPath: 'dirname/setup/',
      routesPath: 'dirname/routes',
      isWsServer: false,
      isCikProtocol: true
    });
  });

  test('init should execute default on the config', async () => {
    const config = {flowsPath: 'ddd', isWsServer: true};
    await index.init('dirname', config);
    
    expect(config).toMatchObject({
      flowsPath: 'ddd',
      setupPath: 'dirname/setup/',
      routesPath: 'dirname/routes',
      isWsServer: true,
      isCikProtocol: true
    });
  });

});