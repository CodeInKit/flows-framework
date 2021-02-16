import _ from 'lodash';
import { promises as fs } from 'fs';
import path from 'path';
import Promise from 'bluebird';
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
async function getAllFilesAndPathsForRegister(data) {
    const savedFilePath = [];
    async function getFolder(folderPath) {
        const files = await fs.readdir(folderPath);
        await Promise.each(files, async (file) => {
            const fullFilePath = path.join(folderPath, file);
            const stats = await fs.stat(fullFilePath);
            if (stats.isDirectory()) {
                await getFolder(fullFilePath);
            }
            else {
                savedFilePath.push(fullFilePath);
            }
        });
    }
    await getFolder(data.flowsPath);
    return { ...data, savedFilePath };
}
function normalizeAllPaths(data) {
    const relativePath = _.map(data.savedFilePath, (p) => path.relative(data.flowsPath, p));
    const jsAndTsFiles = _.filter(relativePath, (p) => p.endsWith('.js') || p.endsWith('.ts'));
    const unregisteredPaths = _.filter(jsAndTsFiles, (p) => !p.includes('/_'));
    return { ...data, flowsPaths: unregisteredPaths };
}
async function registerFlows(data, unsafe) {
    await Promise.each(data.flowsPaths, async (p) => {
        const flowPath = path.join(data.flowsPath, p);
        flowsFrameworkInitDebug(`flow ${flowPath}`);
        try {
            const flow = await import(flowPath);
            flowsFrameworkInitDebug(`required ${flowPath}`);
            const indexPos = p.indexOf('/index.js');
            if (indexPos !== -1) {
                flowsFrameworkInitDebug(`register ${p.substring(0, indexPos)}`);
                unsafe.flows.register(p.substring(0, indexPos), flow.default || flow);
            }
            else {
                flowsFrameworkInitDebug(`register ${p.substring(0, indexPos)}`);
                unsafe.flows.register(p.substring(0, p.length - 3), flow.default || flow);
            }
        }
        catch (err) {
            console.error(err);
            throw new Error(err);
        }
    });
    return data;
}
