import Router, { IMiddleware, IRouterOptions } from 'koa-router'
import { isBoolean, isFunction } from 'lodash'
import { assert } from '../utils'

const routerMetaInfo = new Map<string, Meta>()

// 路由构造器选项
interface RouterOptions extends IRouterOptions {
  moduleName?: string
  mountPermission?: boolean
}

// 路由元信息
interface Meta {
  permissionName?: string // 权限名称，如 “deleteUser”
  moduleName?: string // 权限所属模块名称，如 “用户”
  mount?: boolean // 是否挂载该权限
}

/**
 * 自定义路由继承自koa-router
 * 主要用于视图函数的权限自定义
 * @module 模块名称，用来指明该接口所属的模块，为可选项。对于附加权限控制的接口，必须指定模块名称，而普通接口则不需指定。
 * @mountPermission 是否挂载权限，如果存在 permission，默认挂载
 */
class PowerRouter extends Router {
  private moduleName?: string
  private mountPermission = true

  constructor(options: RouterOptions) {
    super(options)

    if (options?.moduleName) this.moduleName = options.moduleName
    if (isBoolean(options?.mountPermission)) this.mountPermission = options.mountPermission
  }

  /**
   * 辅助方法，帮助生成路由元信息
   * @param permissionName ，权限名称
   * @param mount ，是否挂载
   * @returns Meta 路由元信息对象
   */
  permission(permissionName: string, mount?: boolean): Meta {
    const res = {
      permissionName,
      moduleName: this.moduleName,
      mount: mount ? !!mount : this.mountPermission
    }
    return res
  }

  powerOption(
    name: string,
    path: string | RegExp,
    meta?: Meta | IMiddleware,
    ...middleware: IMiddleware[]
  ) {
    this.setRouterMetaInfo(name, 'OPTION', meta)
    if (isFunction(meta)) {
      return this.options(name, path, meta, ...middleware)
    }
    return this.options(name, path, ...middleware)
  }

  powerHead(
    name: string,
    path: string | RegExp,
    meta?: Meta | IMiddleware,
    ...middleware: IMiddleware[]
  ) {
    this.setRouterMetaInfo(name, 'HEAD', meta)
    if (isFunction(meta)) {
      return this.head(name, path, meta, ...middleware)
    }
    return this.head(name, path, ...middleware)
  }

  powerGet(
    name: string,
    path: string | RegExp,
    meta?: Meta | IMiddleware,
    ...middleware: IMiddleware[]
  ) {
    this.setRouterMetaInfo(name, 'GET', meta)
    if (isFunction(meta)) {
      return this.get(name, path, meta, ...middleware)
    }
    return this.get(name, path, ...middleware)
  }

  powerPut(
    name: string,
    path: string | RegExp,
    meta?: Meta | IMiddleware,
    ...middleware: IMiddleware[]
  ) {
    this.setRouterMetaInfo(name, 'PUT', meta)
    if (isFunction(meta)) {
      return this.put(name, path, meta, ...middleware)
    }
    return this.put(name, path, ...middleware)
  }

  powerPatch(
    name: string,
    path: string | RegExp,
    meta?: Meta | IMiddleware,
    ...middleware: IMiddleware[]
  ) {
    this.setRouterMetaInfo(name, 'PATCH', meta)
    if (isFunction(meta)) {
      return this.patch(name, path, meta, ...middleware)
    }
    return this.patch(name, path, ...middleware)
  }

  powerPost(
    name: string,
    path: string | RegExp,
    meta?: Meta | IMiddleware,
    ...middleware: IMiddleware[]
  ) {
    this.setRouterMetaInfo(name, 'POST', meta)
    if (isFunction(meta)) {
      return this.post(name, path, meta, ...middleware)
    }
    return this.post(name, path, ...middleware)
  }

  powerDelete(
    name: string,
    path: string | RegExp,
    meta?: Meta | IMiddleware,
    ...middleware: IMiddleware[]
  ) {
    this.setRouterMetaInfo(name, 'DELETE', meta)
    if (isFunction(meta)) {
      return this.delete(name, path, meta, ...middleware)
    }
    return this.delete(name, path, ...middleware)
  }

  private setRouterMetaInfo(
    name: string,
    method: string,
    meta?: Meta | IMiddleware
  ) {
    if ((meta as Meta)?.mount) {
      assert(
        !!((meta as Meta)?.permissionName && (meta as Meta)?.moduleName),
        'permissionName and moduleName must not be empty, if you want to mount'
      )

      const endpoint = `${method.toUpperCase()} ${name}`
      routerMetaInfo.set(endpoint, { ...meta }) // 将meta加入routerMetaInfo Map
    }
  }
}

export { routerMetaInfo, PowerRouter }
