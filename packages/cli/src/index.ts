import { IProjectConfig } from '@tarojs/taro/types/compile'
import { PluginOptions } from './plugins/taro-mini-remote-chunk-plugin'

const path = require('path')

export function addMiniRemoteChunkTaroPlugin(config: IProjectConfig, pluginOptions: PluginOptions) {
    if (!config.plugins) {
        config.plugins = []
    }
    config.plugins.push([path.join(__dirname, './plugins/taro-mini-remote-chunk-plugin'), pluginOptions])
    return config
}
