"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const webpack_mini_remote_chunk_plugin_1 = __importDefault(require("../webpack-mini-remote-chunk-plugin"));
const getDirectoryHash_1 = require("../../helper/getDirectoryHash");
const getPort = require('get-port');
const path = require('path');
const http = require('http');
const serveStatic = require('serve-static');
const finalhandler = require('finalhandler');
const colors = require('colors');
let isDevServerLaunch = false;
exports.default = async (ctx, pluginOpts) => {
    const { runOpts, paths } = ctx;
    if (runOpts.options.platform !== 'weapp')
        return;
    const { publicPath, remoteChunkOutputPath, entryChunkUseCache, devServerPort = 9090 } = pluginOpts;
    const serverPort = await getPort({ port: devServerPort });
    async function createServer() {
        try {
            if (isDevServerLaunch)
                return;
            const serveStaticPath = path.join(paths.outputPath);
            const serve = serveStatic(serveStaticPath);
            var server = http.createServer((req, res) => {
                serve(req, res, finalhandler(req, res));
            });
            server.listen(serverPort);
            isDevServerLaunch = true;
            console.log(colors.green(`\n✅  remote-chunk静态服务启动成功，端口： ${serverPort}\n`));
        }
        catch (error) {
            console.error(error);
            console.log(colors.red('\n❌ taro-mini-remote-chunk-plugin 静态服务启动失败 !\n'));
        }
    }
    function normalizeOptions() {
        return {
            publicPath: runOpts.options.isWatch ? `http://127.0.0.1:${serverPort}` : publicPath,
            remoteChunkOutputPath,
            entryChunkUseCache,
        };
    }
    ctx.onBuildStart(() => {
        if (runOpts.options.isWatch) {
            createServer();
        }
    });
    ctx.modifyWebpackChain(({ chain }) => {
        chain.plugin('mini-remote-plugin').use(webpack_mini_remote_chunk_plugin_1.default, [normalizeOptions()]).end();
    });
    ctx.onBuildFinish(() => {
        if (!runOpts.options.isWatch) {
            const remoteAbsolutePath = path.join(paths.outputPath, remoteChunkOutputPath);
            const basicHash = (0, getDirectoryHash_1.getDirectoryHash)(paths.outputPath, remoteAbsolutePath);
            const remotehash = (0, getDirectoryHash_1.getDirectoryHash)(remoteAbsolutePath);
            console.log(colors.green(`\n💟 无法热更新内容hash: ${basicHash} \n`));
            console.log(colors.green(`\n💓 支持热更新内容hash: ${remotehash} \n`));
        }
    });
};
