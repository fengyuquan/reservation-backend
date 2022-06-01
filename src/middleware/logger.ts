import fs from 'fs'
import { Next, ParameterizedContext } from 'koa'
import log4js from 'log4js'
import path from 'path'
import config from '../config'

const logsDir = path.resolve(__dirname, '../../', config.log4j.logDir)
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir)
}

log4js.configure({
  // 设置日志输出到哪里
  appenders: {
    console: { type: 'console' },
    dateFile: {
      type: 'dateFile',
      filename: path.join(logsDir, config.log4j.logName),
      pattern: '-yyyy-MM-dd',
      encoding: 'utf-8',
      // 输出的日志文件名是都始终包含 pattern 日期结尾
      alwaysIncludePattern: true
    }
  },
  categories: {
    default: {
      appenders: config.env === 'development' ? ['console'] : ['dateFile'],
      level: 'info'
    }
  }
})

// 获得 log4js 的 Logger 实例
const logger = log4js.getLogger('[Default]')

const loggerMiddleware = async (ctx: ParameterizedContext, next: Next) => {
  const start = Number(new Date())
  await next()
  const ms = Number(new Date()) - start

  const remoteAddress = ctx.header['x-forwarded-for'] || ctx.ip || ctx.ips
  const logText = `${ctx.method} ${ctx.status} ${ctx.url} 请求参数：${JSON.stringify(ctx.request.body)} 响应参数：${JSON.stringify(ctx.body)} ${remoteAddress} - ${ms}ms`

  logger.info(logText)
  if (ctx.error) {
    logger.error(ctx.error)
  }
}

export { loggerMiddleware, logger }
