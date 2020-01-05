const path = require('path')
const fs = require('fs').promises;
const _ = require('lodash');
const Promise = require('bluebird');
const { Flows } = require('@codeinkit/flows');
const debug = require('debug')('flows:framework');

/**
 * 
 * @param {string} path 
 * @param {Stats} stats 
 */
async function checkNamespace(path, stats) {
  return stats.isDirectory() && await fs.access(path);
}

/**
 * 
 * @param {Object} data 
 * @param {string} data.normalizedFlowsPath 
 * @param {Object} unsafe 
 * @param {Flows} unsafe.flows
 */
async function registerFlows(data, unsafe) {
  await Promise.each(fs.readdir(data.normalizedFlowsPath), async (filename) => {
    if(filename === '.gitkeep') return;

    const stats = await fs.stat(data.normalizedFlowsPath + '/' + filename);
    const isNamespace = await checkNamespace(data.normalizedFlowsPath + '/' + filename + '/index.js', stats);
    const namespaceFlows = isNamespace ? await fs.readdir(data.normalizedFlowsPath + '/' + filename): [''];

    namespaceFlows.forEach((nfilename) => {
      const flow = require(`${data.normalizedFlowsPath}/${filename}${!_.isEmpty(nfilename) ? '/' + nfilename : ''}`);
      const filenameWithoutSuffix = stats.isDirectory() ? nfilename.split('.').slice(0, -1).join('.') : filename.split('.').slice(0, -1).join('.');

      debug(`register ${!_.isEmpty(nfilename) ? nfilename + '/' : ''}${filenameWithoutSuffix} with actions [${_.map(flow, f=> f.name).join(', ')}]`)
      unsafe.flows.register(`${!_.isEmpty(nfilename) ? nfilename + '/' : ''}${filenameWithoutSuffix}`, flow);
    });
  });

  return data;
}

/**
 * 
 * @param {Object} data 
 * @param {string} data.normalizedSetupPath 
 * @param {boolean} data.isSaveSetupInGlobal 
 */
async function loadSetup(data) {
  const setupDir = await fs.readdir(data.normalizedSetupPath);
  
  setupDir.forEach((filename) => {
    const singleSetup = require(data.normalizedSetupPath + filename);

    if(data.isSaveSetupInGlobal) {
      const filenameWithoutSuffix = filename.split('.').slice(0, -1).join('.');
      global[filenameWithoutSuffix] = singleSetup;
    }
  });

  return data;
}

/**
 * 
 * @param {Object} data 
 * @param {boolean} data.isWsServer
 * @param {string} data.normalizedRoutesPath
 * @param {Object} unsafe 
 * @param {Flows}  unsafe.flows 
 */
function loadRoutes(data, unsafe) {
  if(data.isWsServer) {
    require('./ws-routes')(unsafe.flows.execute.bind(unsafe.flows), data);
  }
  
  require(data.normalizedRoutesPath)(unsafe.flows.execute.bind(unsafe.flows));

  return data;
}

const runFlows = new Flows();
const initFlows = new Flows();

initFlows.register('init', [
  registerFlows,
  loadSetup,
  loadRoutes
]);

module.exports = {
  /**
   * 
   * @param {string} dirname the __dirname of the folder that we execute from
   * @param {Object} config 
   * @param {string} config.normalizedFlowsPath the flows folder path
   * @param {string} config.normalizedSetupPath the setup folder path
   * @param {string} config.normalizedRoutesPath the routes folder/file path
   * @param {boolean} config.isWsServer if framework should use websocket routes
   * @param {boolean} config.isSaveSetupInGlobal if the setup should be saved in global
   */
  async init(dirname, config = {}) {
    _.defaults(config, {
      normalizedFlowsPath: path.join(dirname, 'flows/'),
      normalizedSetupPath: path.join(dirname, 'setup/'),
      normalizedRoutesPath: path.join(dirname, 'routes'),
      isWsServer: false,
      isSaveSetupInGlobal: false,
      isCikProtocol: true
    });

    return initFlows.execute('init', config, {flows: runFlows})
  },
  flows: runFlows
}