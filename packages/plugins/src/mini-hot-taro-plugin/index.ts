import { IPluginContext } from '@tarojs/service'
import MiniRemoteChunkWebpackPlugin from '../mini-hot-webpack-plugin'
import { getDirectoryHash } from '../helper/getDirectoryHash'

const getPort = require('get-port')
const path = require('path')
const http = require('http')
const serveStatic = require('serve-static')
const finalhandler = require('finalhandler')
const colors = require('colors')

let isDevServerLaunch = false

export type PluginOptions = {
    publicPath: string
    hotUpdateAssetsOutputPath: string
    entryChunkUseCache: boolean | ((url: string) => string)
    devServerPort: number
}

export default async (ctx: IPluginContext, pluginOpts: PluginOptions) => {
    const { runOpts, paths } = ctx

    if (runOpts.options.platform !== 'weapp') return

    const { publicPath, hotUpdateAssetsOutputPath, entryChunkUseCache, devServerPort = 9090 } = pluginOpts

    const serverPort = await getPort({ port: devServerPort })

    async function createServer() {
        try {
            if (isDevServerLaunch) return

            const serveStaticPath = path.join(paths.outputPath)

            const serve = serveStatic(serveStaticPath)

            var server = http.createServer((req, res) => {
                serve(req, res, finalhandler(req, res))
            })

            server.listen(serverPort)

            isDevServerLaunch = true

            console.log(colors.green(`\n✅  remote-chunk静态服务启动成功，端口： ${serverPort}\n`))
        } catch (error) {
            console.error(error)
            console.log(colors.red('\n❌ taro-mini-remote-chunk-plugin 静态服务启动失败 !\n'))
        }
    }

    function normalizeOptions() {
        return {
            publicPath: runOpts.options.isWatch ? `http://127.0.0.1:${serverPort}` : publicPath,
            hotUpdateAssetsOutputPath,
            entryChunkUseCache,
        }
    }

    ctx.onBuildStart(() => {
        if (runOpts.options.isWatch) {
            createServer()
        }
    })

    ctx.modifyWebpackChain(({ chain }) => {
        chain.plugin('mini-remote-plugin').use(MiniRemoteChunkWebpackPlugin, [normalizeOptions()]).end()
    })

    ctx.onBuildFinish(() => {
        if(!runOpts.options.isWatch) {
            const remoteAbsolutePath = path.join(paths.outputPath, hotUpdateAssetsOutputPath)
            const basicHash = getDirectoryHash(paths.outputPath, remoteAbsolutePath)
            const remoteHash = getDirectoryHash(remoteAbsolutePath)
            console.log(colors.green(`\n💟 无法热更新内容hash: ${basicHash} \n`))
            console.log(colors.green(`\n💓 支持热更新内容hash: ${remoteHash} \n`))
        }
    })
}
