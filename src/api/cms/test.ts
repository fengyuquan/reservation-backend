import { PowerRouter } from '../../lib/router'
import { PositiveIntegerValidator } from '../../validator/common'

const test = new PowerRouter({
  prefix: '/cms/test',
  moduleName: '测试',
  mountPermission: true
})

test.powerGet(
  'testGet',
  '/',
  // test.permission('测试权限'),
  // loginRequired,
  async (ctx) => {
    const v = await new PositiveIntegerValidator(ctx).validate()
    console.log(v)

    ctx.body = '测试参数检验器'
  }
)

export default test
