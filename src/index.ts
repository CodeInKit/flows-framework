import path from 'path';
import _ from 'lodash';
import { Flows, SupportedHooks } from '@codeinkit/flows';
import initFlow from './init';
import debug from 'debug';

const flowsFrameworkDebug = debug('flows:framework');
const runFlows = new Flows();
const initFlows = new Flows();

initFlows.register('init', initFlow);
initFlows.hook(SupportedHooks.pre_action, a => flowsFrameworkDebug(JSON.stringify(a)));
initFlows.hook(SupportedHooks.post_action, a => flowsFrameworkDebug(JSON.stringify(a)));

export default {
  /**
   * 
   * @param {string} dirname the __dirname of the folder that we execute from
   * @param {Object} config 
   * @param {string} config.flowsPath the flows folder path
   */
  async init(dirname: string, config = {}) {
    _.defaults(config, {
      flowsPath: path.join(dirname, 'flows/')
    });

    await initFlows.execute('init', config, {flows: runFlows});
    await runFlows.execute('init', {});

    return initFlows
  },

  addRoute(routeFn: (execute: (flowName: string, initValue: object) => object) => void) {
    routeFn(runFlows.execute.bind(runFlows));
  },

  flows: runFlows
}