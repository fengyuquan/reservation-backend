import jwt, { JsonWebTokenError, JwtPayload } from 'jsonwebtoken'
import config from '../config'
import { AuthFailed, Forbidden, NotFound, UnAuthenticated } from '../exception'
import { IUserContext } from '../lib/interface'
import { GroupLevel } from '../lib/type'
import { GroupModel } from '../model/group'
import { UserModel } from '../model/user'
import { UserGroupModel } from '../model/user-group'

function generateToken(uid: number) {
  const { secretKey, expiresIn } = config.security

  return jwt.sign(
    {
      uid
    },
    secretKey,
    {
      expiresIn
    }
  )
}

function getIdFromToken(ctx: IUserContext) {
  let decode: JwtPayload | string

  if (!ctx.header?.authorization) {
    throw new UnAuthenticated(20007) // 未携带token访问
  }

  const parts = ctx.header.authorization.split(' ')
  if (parts.length === 2) {
    // Bearer 字段
    const scheme = parts[0]
    // token 字段
    const token = parts[1]

    if (/^Bearer$/i.test(scheme)) {
      if (!token) {
        throw new UnAuthenticated(20007) // 未携带token访问
      }
      try {
        decode = jwt.verify(token, config.security.secretKey)
      } catch (error) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if ((error as JsonWebTokenError).name == 'TokenExpiredError') {
          throw new UnAuthenticated(20004) // 令牌已过期
        }
        throw new UnAuthenticated(20003) // 令牌失效或损坏
      }
    } else {
      throw new AuthFailed(20008) // 认证头字段解析失败
    }
  } else {
    throw new AuthFailed(20008)
  }
  return (decode as JwtPayload).uid
}

/**
 * 将 user 挂在 ctx 上，有验证用户是否存在的功能
 */
async function mountUser(ctx: IUserContext) {
  const id = getIdFromToken(ctx)
  const user = await UserModel.findByPk(id)
  if (!user) {
    throw new AuthFailed(20005)
  }

  // 将user挂在ctx上
  ctx.currentUser = user
}

/**
 * 判断操作的用户是否是超级管理员
 * 超级管理员只属于root这一个组
 */
async function isRootAdmin(userId: number) {
  const userGroup = await UserGroupModel.findOne({
    where: {
      user_id: userId
    }
  })
  if (!userGroup) {
    throw new Forbidden(40001) // 用户还没有分配组，请联系管理员分配
  }
  const group = await GroupModel.findByPk(userGroup.group_id)
  if (!group) {
    throw new NotFound(40002) // 用户所在组不存在，请联系管理员
  }
  if (group.level === GroupLevel.Root) {
    return true
  } else {
    return false
  }
}

export { mountUser, isRootAdmin, generateToken }
