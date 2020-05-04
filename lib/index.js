const path = require('path')
const _ = require('lodash');
const { Flows } = require('@codeinkit/flows');
const initFlow = require('./init');
const debug = require('debug')('flows:framework');

const runFlows = new Flows();
const initFlows = new Flows();

initFlows.register('init', initFlow);
initFlows.hook('pre_action', a => debug(JSON.stringify(a)));
initFlows.hook('post_action', a => debug(JSON.stringify(a)));

module.exports = {
  /**
   * 
   * @param {string} dirname the __dirname of the folder that we execute from
   * @param {Object} config 
   * @param {string} config.flowsPath the flows folder path
   */
  async init(dirname, config = {}) {
    _.defaults(config, {
      flowsPath: path.join(dirname, 'flows/')
    });

    await initFlows.execute('init', config, {flows: runFlows});
    await runFlows.execute('init', {});
  },

  addRoute(routeFn) {
    routeFn(runFlows.execute.bind(runFlows))
  },

  flows: runFlows
}