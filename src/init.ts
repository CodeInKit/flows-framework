import _ from 'lodash';
import {promises as fs} from 'fs';
import path from 'path';
import Promise from 'bluebird';
import { Flows, IActionData } from "@codeinkit/flows";
import debug from 'debug';

const flowsFrameworkInitDebug = debug('flows:framework:init');

export default [
  getAllFilesAndPathsForRegister,
  normalizeAllPaths,
  registerFlows
];

/**
 * 
 * @param {object} data 
 */

async function getAllFilesAndPathsForRegister(data: {flowsPath?: string} & IActionData) {
  const savedFilePath: string[] = [];
  async function getFolder(folderPath: string) {
    const files: string[] = await fs.readdir(folderPath);
    
    await Promise.each(files, async (file: string) => {
      const fullFilePath = path.join(folderPath, file);
      const stats = await fs.stat(fullFilePath);
      
      if(stats.isDirectory()) {
        await getFolder(fullFilePath);
      } else {
        savedFilePath.push(fullFilePath);
      }
    });
  }

  await getFolder(data.flowsPath as string);
  return { ...data, savedFilePath }
}

function normalizeAllPaths(data: { savedFilePath?: string[]; flowsPath?: string; } & IActionData) {
  const relativePath: string[] = _.map(data.savedFilePath, (p: string) => path.relative(data.flowsPath as string, p));
  const jsAndTsFiles: string[] = _.filter(relativePath, (p: string) => p.endsWith('.js') || p.endsWith('.ts'));
  const unregisteredPaths: string[] = _.filter(jsAndTsFiles, (p: string) => !p.includes('/_'));

  return { ...data, flowsPaths: unregisteredPaths }
}

async function registerFlows(data: { flowsPaths?: string[]; savedFilePath?: string[]; flowsPath?: string; } & IActionData, unsafe: {flows?: Flows}) {
  await Promise.each(data.flowsPaths as string[], async (p: string) => {
    const flowPath = path.join(data.flowsPath as string, p);
    flowsFrameworkInitDebug(`flow ${flowPath}`);

    try {
        const flow = await import(flowPath);
        flowsFrameworkInitDebug(`required ${flowPath}`);
        const indexPos = p.indexOf('/index.js');
        if(indexPos !== -1) {
          flowsFrameworkInitDebug(`register ${p.substring(0, indexPos)}`);
          (unsafe.flows as Flows).register(p.substring(0, indexPos), flow.default || flow);
        } else {
          flowsFrameworkInitDebug(`register ${p.substring(0, indexPos)}`);
          (unsafe.flows as Flows).register(p.substring(0, p.length -3), flow.default || flow);
        }
    } catch(err) {
      console.error(err);
      throw new Error(err);
    }
  });

  return data;
}
