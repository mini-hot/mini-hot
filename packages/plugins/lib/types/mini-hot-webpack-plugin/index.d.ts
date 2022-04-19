import SplitChunksPlugin from 'webpack/lib/optimize/SplitChunksPlugin';
declare type CacheGroups = {
    [k in string]: any;
};
export default class MiniRemoteChunkPlugin extends SplitChunksPlugin {
    dynamicModules: Set<unknown>;
    moduleBuildInfoMap: Map<any, any>;
    dynamicModuleReasonMap: Map<any, any>;
    splitChunkNames: string[];
    options: null;
    publicPath: string;
    hotUpdateAssetsOutputPath: string;
    entryChunkUseCache: boolean;
    constructor(o: any);
    apply(compiler: any): void;
    collectDynamicModules: (modules: any) => void;
    isEntryDynamicModule: (moduleId: any) => any;
    getDynamicChunkCacheGroups: (initialCacheGroups?: CacheGroups) => unknown;
    getChunkName: (moduleId: any) => string;
    stableChunkId: (chunks: any) => void;
    injectVar: (mainTemplate: any) => void;
    rewriteJsonpScriptSrcFunc: (mainTemplate: any) => void;
    rewriteJsonpScriptFunc: (mainTemplate: any) => void;
    rewriteRequireEnsureFunc: (mainTemplate: any) => void;
}
export {};
