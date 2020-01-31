const _ = require('lodash');
const Promise = require('bluebird');
const fs = require('fs');
const path = require('path')

require('typescript-require');
Promise.promisifyAll(fs);

/**
 * 
 * @param {object} data 
 */
async function getAllFilesAndPathsForRegister(data) {
  const savedFilePath = [];
  async function getFolder(folderPath) {
    const files = await fs.readdirAsync(folderPath);
    
    await Promise.each(files, async file => {
      const fullFilePath = path.join(folderPath, file);
      const stats = await fs.statAsync(fullFilePath);
      
      if(stats.isDirectory()) {
        await getFolder(fullFilePath);
      } else {
        savedFilePath.push(fullFilePath);
      }
    });
  }

  await getFolder(data.flowsPath);
  return { ...data, savedFilePath }
}

function normalizeAllPaths(data) {
  const relativePath = _.map(data.savedFilePath, p => path.relative(data.flowsPath, p));
  const jsAndTsFiles = _.filter(relativePath, p => p.endsWith('.js') || p.endsWith('.ts'));
  const unregisteredPaths = _.filter(jsAndTsFiles, p => !p.includes('/_'));

  return { ...data, flowsPaths: unregisteredPaths }
}

async function registerFlows(data, unsafe) {
  await Promise.each(data.flowsPaths, p => {
    const flowPath = path.join(data.flowsPath, p);
    const flow = require(flowPath);
    unsafe.flows.register(p, flow);
  });

  return data;
}

/**
 * 
 * @param {Object} data 
 * @param {string} data.setupPath 
 * @param {boolean} data.isSaveSetupInGlobal 
 */
async function loadSetup(data) {
  const setupDir = await fs.readdirAsync(data.setupPath);
  
  setupDir.forEach((filename) => {
    require(data.setupPath + filename);
  });

  return data;
}

/**
 * 
 * @param {Object} data 
 * @param {boolean} data.isWsServer
 * @param {string} data.routesPath
 * @param {Object} unsafe 
 * @param {Flows}  unsafe.flows 
 */
function loadRoutes(data, unsafe) {
  if(data.isWsServer) {
    require('./ws-routes')(unsafe.flows.execute.bind(unsafe.flows), data);
  }

  if(data.isRest) {
    require('./rest-routes')(unsafe.flows.execute.bind(unsafe.flows), data);
  }

  try {
    require(data.routesPath)(unsafe.flows.execute.bind(unsafe.flows));
  } catch {
    console.warn('no routes path found, skip...');
  }

  return data;
}

module.exports = [
  getAllFilesAndPathsForRegister,
  normalizeAllPaths,
  registerFlows,
  loadSetup,
  loadRoutes
];