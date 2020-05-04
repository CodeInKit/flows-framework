const _ = require('lodash');
const Promise = require('bluebird');
const fs = require('fs');
const path = require('path')
const debug = require('debug')('flows:framework:init');

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
    
    try {
        const flow = require(flowPath);
        const indexPos = p.indexOf('/index.js');
        if(indexPos !== -1) {
          debug(`register ${p.substring(0, indexPos)}`)
          unsafe.flows.register(p.substring(0, indexPos), flow.default || flow);
        } else {
          debug(`register ${p.substring(0, indexPos)}`)
          unsafe.flows.register(p.substring(0, p.length -3), flow.default || flow);
        }
    } catch(err) {
      console.error(err);
    }
  });

  return data;
}

module.exports = [
  getAllFilesAndPathsForRegister,
  normalizeAllPaths,
  registerFlows
];