import { Flows } from '@codeinkit/flows';
declare const _default: {
    /**
     *
     * @param {string} dirname the __dirname of the folder that we execute from
     * @param {Object} config
     * @param {string} config.flowsPath the flows folder path
     */
    init(dirname: string, config?: {}): Promise<Flows>;
    addRoute(routeFn: (execute: (flowName: string, initValue: object) => object) => void): void;
    flows: Flows;
};
export default _default;
