import cors from '@koa/cors'
import koa from 'koa'
import koaBodyParser from 'koa-bodyparser'
import koaHelmet from 'koa-helmet'
import koaStatic from 'koa-static'
import path from 'path'
import config from './config'
import Init from './core/init'
import catchError from './middleware/exception'
import { loggerMiddleware } from './middleware/logger'

// Init Koa instance
const app = new koa()

// Logger
app.use(loggerMiddleware)

// Error Handler
app.use(catchError)

// global middewares
app.use(koaHelmet())
app.use(koaBodyParser())
app.use(cors())
app.use(koaStatic(path.resolve(__dirname, './static')))

// 初始化，加载路由，初始化权限数据库表等
Init.initCore(app)

app.listen(config.port, () => {
  console.log(`服务已经在 ${config.port} 端口启动...`)
})
