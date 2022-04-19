"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addMiniRemoteChunkTaroPlugin = void 0;
const path = require('path');
function addMiniRemoteChunkTaroPlugin(config, pluginOptions) {
    if (!config.plugins) {
        config.plugins = [];
    }
    config.plugins.push([path.join(__dirname, './plugins/taro-mini-remote-chunk-plugin'), pluginOptions]);
    return config;
}
exports.addMiniRemoteChunkTaroPlugin = addMiniRemoteChunkTaroPlugin;
