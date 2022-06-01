import { Next } from 'koa'
import { Op } from 'sequelize'
import { Forbidden } from '../exception'
import { IUserContext } from '../lib/interface'
import { routerMetaInfo } from '../lib/router'
import { MountType } from '../lib/type'
import { GroupPermissionModel } from '../model/group-permission'
import { PermissionModel } from '../model/permission'
import { UserModel } from '../model/user'
import { UserGroupModel } from '../model/user-group'
import { isRootAdmin, mountUser } from '../utils'

/**
 * 守卫函数，非超级管理员不可访问
 */
async function adminRequired(ctx: IUserContext, next: Next) {
  if (ctx.request.method === 'OPTIONS') {
    // option请求直接通过
    await next()
  } else {
    await mountUser(ctx)
    // 上面的挂载操如果不抛出错误，那么这里的currentUser一定存在
    if (await isRootAdmin((ctx.currentUser as UserModel).id)) {
      await next()
    } else {
      throw new Forbidden(20002)
    }
  }
}

/**
 * 守卫函数，用户登陆即可访问
 */
async function loginRequired(ctx: IUserContext, next: Next) {
  if (ctx.request.method === 'OPTIONS') {
    // option请求直接通过
    await next()
  } else {
    await mountUser(ctx)
    await next()
  }
}

/**
 * 守卫函数，用于权限组鉴权 IRouterParamContext
 */
async function groupRequire(ctx: IUserContext, next: Next) {
  if (ctx.request.method === 'OPTIONS') {
    // option请求直接通过
    await next()
  } else {
    await mountUser(ctx)
    // 上面的挂载操如果不抛出错误，那么这里的currentUser一定存在
    const userId = (ctx.currentUser as UserModel).id
    if (await isRootAdmin(userId)) {
      // 超级管理员直接过
      await next()
    } else {
      // 1 从routerMetaInfo获取当前匹配路由的路由权限信息
      const endpoint = `${ctx.method} ${ctx._matchedRouteName}`
      const metaInfo = routerMetaInfo.get(endpoint)
      if (!metaInfo) {
        // TODO 路由权限信息不存在，抛出服务端错误
      } else {
        // 2 判断用户是否有访问这条路由的权限
        // 2.1 先找到该用户的所有组id
        const { permissionName, moduleName } = metaInfo
        const userGroup = await UserGroupModel.findAll({
          where: {
            user_id: userId
          }
        })
        if (!userGroup) {
          //TODO 抛出用户不属于任何组，请联系管理员分配组
          throw new Error()
        }
        const groupIds = userGroup.map((v) => v.group_id)

        // 2.2 找到用户所有的权限id
        const groupPermission = await GroupPermissionModel.findAll({
          where: {
            group_id: {
              [Op.in]: groupIds
            }
          }
        })
        if (!groupPermission) {
          // TODO 抛出该用户存在的组没有分配任何权限，请联系管理
          throw new Error()
        }
        const permissionIds = groupPermission.map((v) => v.permission_id)

        // 2.3 判断该用户是否有访问这条路由的权限
        const permission = await PermissionModel.findOne({
          where: {
            name: permissionName,
            module: moduleName,
            mount: MountType.Mount,
            id: {
              [Op.in]: permissionIds
            }
          }
        })

        if (!permission) {
          // TODO 抛出该用户无权限访问
          throw new Error()
        }
        await next()
      }
    }
    await next()
  }
}

export { adminRequired, loginRequired, groupRequire }
