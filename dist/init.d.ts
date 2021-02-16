import { Flows, IActionData } from "@codeinkit/flows";
declare const _default: (typeof getAllFilesAndPathsForRegister | typeof normalizeAllPaths | typeof registerFlows)[];
export default _default;
/**
 *
 * @param {object} data
 */
declare function getAllFilesAndPathsForRegister(data: {
    flowsPath?: string;
} & IActionData): globalThis.Promise<{
    savedFilePath: string[];
    flowsPath?: string | undefined;
    __flows?: {
        flowName?: string | undefined;
        jump?: string | undefined;
        error?: Error | undefined;
        done?: boolean | undefined;
        requestId?: string | undefined;
    } | undefined;
}>;
declare function normalizeAllPaths(data: {
    savedFilePath?: string[];
    flowsPath?: string;
} & IActionData): {
    flowsPaths: string[];
    savedFilePath?: string[] | undefined;
    flowsPath?: string | undefined;
    __flows?: {
        flowName?: string | undefined;
        jump?: string | undefined;
        error?: Error | undefined;
        done?: boolean | undefined;
        requestId?: string | undefined;
    } | undefined;
};
declare function registerFlows(data: {
    flowsPaths?: string[];
    savedFilePath?: string[];
    flowsPath?: string;
} & IActionData, unsafe: {
    flows?: Flows;
}): globalThis.Promise<{
    flowsPaths?: string[] | undefined;
    savedFilePath?: string[] | undefined;
    flowsPath?: string | undefined;
} & IActionData>;
