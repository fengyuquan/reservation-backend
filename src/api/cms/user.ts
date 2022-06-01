import UserDao from '../../dao/user'
import { IUserContext } from '../../lib/interface'
import { PowerRouter } from '../../lib/router'
import { adminRequired, loginRequired } from '../../middleware/auth'
import {
  LoginValidator,
  RegisterValidator
} from '../../validator/user-validator'

const user = new PowerRouter({
  prefix: '/cms/user',
  moduleName: '用户',
  mountPermission: true
})

user.powerGet(
  'userGetAllPermissions',
  '/permissions',
  user.permission('查询自己拥有的所有权限'),
  // loginRequired,
  async (ctx) => {
    ctx.body = '查询自己拥有的所有权限'
  }
)

/**
 * 获取用户信息
 */
user.get('/info', loginRequired, async (ctx) => {
  ctx.success?.(ctx.currentUser)
})

/**
 * 用户登陆 使用用户名或者邮箱
 */
user.post('/login', async (ctx) => {
  const v = await new LoginValidator(ctx).validate()
  const token = await UserDao.getToken(v)
  ctx.body = { token }
})

/**
 * 新建用户
 */
user.powerPost(
  'registerUser',
  '/register',
  user.permission('新建用户'),
  adminRequired,
  // TODO 添加权限操作纪录日志功能
  async (ctx: IUserContext) => {
    const v = await new RegisterValidator(ctx).validate()
    const user = await UserDao.createUser(v)
    ctx.success?.(user)
  }
)

export default user
