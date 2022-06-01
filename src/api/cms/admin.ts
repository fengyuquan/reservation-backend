import { ParameterizedContext } from 'koa'
import { UnAuthenticated } from '../../exception'
import { PowerRouter } from '../../lib/router'

const admin = new PowerRouter({
  prefix: '/cms/admin',
  moduleName: '管理员',
  mountPermission: false // 管理员的权限不支持分配，开启分配后也无实际作用
})

admin.powerGet(
  'getAllPermissions',
  '/permissions',
  admin.permission('查询所有可分配的权限'),
  // adminRequired,
  async (ctx: ParameterizedContext) => {
    // ctx.body = '查询所有可分配的权限'
    console.log(ctx.method)

    throw new UnAuthenticated()
  }
)

export default admin
