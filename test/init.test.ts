import _ from 'lodash';
import initFlow from '../src/init';
import {promises as fs} from 'fs';
import { Flows } from '@codeinkit/flows';

const actions = _.mapKeys(initFlow, f => f.name);


jest.mock('fs', () => ({
  promises: {
    readdir: jest.fn(),
    stat: jest.fn()
  }
}));

describe('init', () => {

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('getAllFilesAndPathsForRegister should get paths of files', async () => {
    (fs.readdir as any).mockImplementation(() => ['file1.js','file2.js','file3.js']);
    (fs.stat as any).mockImplementation(() => ({isDirectory: jest.fn(() => false)}));

    const res = await actions.getAllFilesAndPathsForRegister({flowsPath: ''}, {});
    expect(res).toMatchObject({flowsPath: '', savedFilePath: ['file1.js','file2.js','file3.js']})
  });

  test('getAllFilesAndPathsForRegister should recursively scan folder', async () => {
    (fs.readdir as any).mockImplementation((path: string) => path === 'folder' ? ['file4.js','file5.js'] : ['file1.js','folder','file3.js']);
    (fs.stat as any).mockImplementation((path: string) => ({isDirectory: jest.fn(() => path === 'folder' ? true : false)}));

    const res = await actions.getAllFilesAndPathsForRegister({flowsPath: ''}, {});
    
    expect(res).toMatchObject({flowsPath: '', savedFilePath: [ 'file1.js', 'folder/file4.js', 'folder/file5.js', 'file3.js' ]})
  });

  test('normalizeAllPaths should get relatives paths', async () => {
    const res = await actions.normalizeAllPaths({
      flowsPath: '/home/user/projects/flowPath',
      savedFilePath: ['/home/user/projects/flowPath/flows/file2.js', '/home/user/projects/flowPath/flows/file1.js']
    }, {});

    expect(res).toMatchObject({
      flowsPath: '/home/user/projects/flowPath',
      flowsPaths: ['flows/file2.js', 'flows/file1.js']
    });
  });

  test('normalizeAllPaths should ignore non js/ts files', async () => {
    const res = await actions.normalizeAllPaths({
      flowsPath: '/home/user/projects/flowPath',
      savedFilePath: ['/home/user/projects/flowPath/flows/file2.js', '/home/user/projects/flowPath/flows/file1.ts', '/home/user/projects/flowPath/flows/to_ignore']
    }, {});

    expect(res).toMatchObject({
      flowsPath: '/home/user/projects/flowPath',
      flowsPaths: ['flows/file2.js', 'flows/file1.ts']
    });
  });

  test('normalizeAllPaths should ignore path that start with underscore', async () => {
    const res = await actions.normalizeAllPaths({
      flowsPath: '/home/user/projects/flowPath',
      savedFilePath: ['/home/user/projects/flowPath/flows/file2.js', '/home/user/projects/flowPath/flows/file1.ts', '/home/user/projects/flowPath/flows/_to_ignore/test.js']
    }, {});

    expect(res).toMatchObject({
      flowsPath: '/home/user/projects/flowPath',
      flowsPaths: ['flows/file2.js', 'flows/file1.ts']
    });
  });
  
  // since we moved to fully backend ts support we no longer need to support default flow
  test.skip('registerFlows with export default', async () => {
    jest.mock('/home/user/projects/flowPath/flows/flow2', () => ({ default: ['second', 'flow'] }), { virtual: true })
    jest.mock('/home/user/projects/flowPath/flows/file1', () => ['actions', 'for', 'flow', '1'], { virtual: true })
    const setup = { flows: { register: jest.fn() } }
    const res = await actions.registerFlows(
      {
        flowsPath: '/home/user/projects/flowPath',
        flowsPaths: ['flows/flow2', 'flows/file1']
      },
      setup as unknown as {flows: Flows}
    )

    expect(setup.flows.register).toBeCalledTimes(2)
    expect(setup.flows.register).toBeCalledWith('flows/file1', ['actions', 'for', 'flow', '1'])
    expect(setup.flows.register).toBeCalledWith('flows/flow2', ['second', 'flow'])
    expect(res).toMatchObject({
      flowsPath: '/home/user/projects/flowPath',
      flowsPaths: ['flows/flow2', 'flows/file1']
    })
  })

  test('registerFlows should loop through every flowsPaths and dynamically require the files', async () => {
    jest.mock('/home/user/projects/flowPath/flows/flow2', () => ['second', 'flow'], { virtual: true });
    jest.mock('/home/user/projects/flowPath/flows/file1', () => ['actions', 'for', 'flow', '1'], { virtual: true });

    const setup = {flows: {register: jest.fn()}};
    const res = await actions.registerFlows({
      flowsPath: '/home/user/projects/flowPath',
      flowsPaths: ['flows/flow2', 'flows/file1']
    }, setup as unknown as {flows: Flows});

    expect(setup.flows.register).toBeCalledTimes(2);
    expect(setup.flows.register).toBeCalledWith('flows/file1', ['actions', 'for', 'flow', '1'])
    expect(setup.flows.register).toBeCalledWith('flows/flow2', ['second', 'flow']);
    expect(res).toMatchObject({
      flowsPath: '/home/user/projects/flowPath',
      flowsPaths: ['flows/flow2', 'flows/file1']
    });
  });

});