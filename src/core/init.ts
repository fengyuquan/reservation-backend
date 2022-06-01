import Application from 'koa'
import Router from 'koa-router'
import path from 'path'
import config from '../config'
import { getFiles } from '../utils'
import { PermissionModel } from '../model/permission'
import { Success } from '../exception'

class Init {
  static app: Application

  static async initCore(app: Application) {
    Init.app = app
    Init.applyExtend() // 在ctx上扩展一些方法
    Init.LoaderRouter() // 注册路由
    await PermissionModel.initPermission() // 初始化权限数据库表
  }

  static LoaderRouter() {
    const apiDirectory = path.normalize(
      `${process.cwd()}/${config.apiDir ?? 'src/api'}`
    )
    const files = getFiles(apiDirectory) // 拿到api目录下所有的文件名
    for (const file of files) {
      const ext = file.substring(file.lastIndexOf('.'))
      if (ext === '.ts') {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const router = require(file).default
        if (router instanceof Router) {
          if (config.env === 'development') {
            console.info(`loading a router instance from file: ${file}`)
          }
          // 注册路由
          Init.app.use(router.routes()).use(router.allowedMethods())
        }
      }
    }
  }

  static applyExtend() {
    // 扩展json方法
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Init.app.context.json = function(obj: any) {
      this.type = 'application/json'
      this.status = 200
      this.body = JSON.stringify(obj)
    }

    // 扩展请求成功，并包含数据
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Init.app.context.success = function(obj: any) {
      this.type = 'application/json'
      const success = new Success()
      const data = {
        code: success.code,
        message: success.message,
        data: obj,
        request: `${this.method} ${this.req.url}`
      }
      this.status = success.status
      this.body = JSON.stringify(data)
    }
  }
}

export default Init
