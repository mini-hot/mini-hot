const http = require('http')
const colors = require('colors')
const serveStatic = require('serve-static')
const finalhandler = require('finalhandler')

let isDevServerLaunch = false

export function startDevServer(serverPort: number, serverPath: string) {
    try {
        if (isDevServerLaunch) return

        const serve = serveStatic(serverPath)

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
