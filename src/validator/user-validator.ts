/* eslint-disable @typescript-eslint/no-explicit-any */
import { IRouterContext } from 'koa-router'
import { LoginType } from '../lib/enum'
import { BaseValidator, Rule } from './base-validator'

class RegisterValidator extends BaseValidator {
  username
  email
  password
  confirm_password

  constructor(ctx: IRouterContext) {
    super(ctx)
    this.username = [new Rule('isLength', '用户名长度必须在2~20之间', 2, 20)]
    this.email = [new Rule('isEmail', '电子邮箱不符合规范，请输入正确的邮箱')]
    this.password = [
      new Rule(
        'matches',
        '密码长度必须在6~22位之间，包含字符、数字和 _ ',
        /^[A-Za-z0-9_*&$#@]{6,22}$/
      )
    ]
    this.confirm_password = this.password
  }

  validateConfirmPassword(data: any) {
    if (
      !data.body.password ||
      !data.body.confirm_password ||
      data.body.password !== data.body.confirm_password
    ) {
      throw new Error('两次输入的密码不一致，请重新输入')
    }
  }
}

class LoginValidator extends BaseValidator {
  username?: Rule[]
  email?: Rule[]
  password

  constructor(ctx: IRouterContext) {
    super(ctx)
    // 判断是什么类型登陆
    const loginType = this.get('body.email')
      ? LoginType.Email
      : LoginType.Username

    // 优先使用邮箱登陆
    this.email = [new Rule('isEmail', '电子邮箱不符合规范，请输入正确的邮箱')]
    if (loginType === LoginType.Username) {
      this.username = [new Rule('isLength', '用户名长度必须在2~20之间', 2, 20)]
      this.email = undefined
    }

    this.password = [
      new Rule(
        'matches',
        '密码长度必须在6~22位之间，包含字符、数字和 _ ',
        /^[A-Za-z0-9_*&$#@]{6,22}$/
      )
    ]

    // TODO 增加验证码校验
  }
}

export { RegisterValidator, LoginValidator }
