const path = require('path')
const _ = require('lodash');
const { Flows } = require('@codeinkit/flows');
const initFlow = require('./init');
const debug = require('debug')('flows:framework');

const runFlows = new Flows();
const initFlows = new Flows();

initFlows.register('init', initFlow);
initFlows.hook('pre_action', debug);
initFlows.hook('post_action', debug);

module.exports = {
  /**
   * 
   * @param {string} dirname the __dirname of the folder that we execute from
   * @param {Object} config 
   * @param {string} config.flowsPath the flows folder path
   * @param {string} config.setupPath the setup folder path
   * @param {string} config.routesPath the routes folder/file path
   * @param {boolean} config.isWsServer if framework should use websocket routes
   */
  async init(dirname, config = {}) {
    _.defaults(config, {
      flowsPath: path.join(dirname, 'flows/'),
      setupPath: path.join(dirname, 'setup/'),
      routesPath: path.join(dirname, 'routes'),
      isWsServer: false,
      isCikProtocol: true,
    });

    return initFlows.execute('init', config, {flows: runFlows})
  },
  flows: runFlows
}