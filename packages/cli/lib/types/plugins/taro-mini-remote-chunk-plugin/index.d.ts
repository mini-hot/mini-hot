import { IPluginContext } from '@tarojs/service';
export declare type PluginOptions = {
    publicPath: string;
    remoteChunkOutputPath: string;
    entryChunkUseCache: boolean | ((url: string) => string);
    devServerPort: number;
};
declare const _default: (ctx: IPluginContext, pluginOpts: PluginOptions) => Promise<void>;
export default _default;
