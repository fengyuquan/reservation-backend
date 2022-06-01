import bcrypt from 'bcryptjs'
import { AuthFailed, Forbidden } from '../exception'
import { LoginType } from '../lib/enum'
import { UserModel } from '../model/user'
import { generateToken } from '../utils'
import { BaseValidator } from '../validator/base-validator'
import { RegisterValidator } from '../validator/user-validator'

class UserDao {
  /**
   * 创建用户
   */
  static async createUser(v: RegisterValidator) {
    let user = await UserModel.findOne({
      where: {
        username: v.get('body.username')
      }
    })
    if (user) {
      throw new Forbidden(20009) // 用户名已经存在
    }
    user = await UserModel.findOne({
      where: {
        email: v.get('body.email')
      }
    })
    if (user) {
      throw new Forbidden(20010) // 邮箱已经存在
    }

    return await UserModel.create({
      email: v.get('body.email'),
      username: v.get('body.username'),
      nickname: v.get('body.nickname'),
      password: v.get('body.password')
    })
  }

  static async getToken(v: BaseValidator) {
    const user = await UserDao._verifyEmailOrNamePassword(v)
    return generateToken(user.id)
  }

  private static async _verifyEmailOrNamePassword(v: BaseValidator) {
    // 判断是什么类型登陆
    const loginType = v.get('body.email') ? LoginType.Email : LoginType.Username
    let user
    if (loginType === LoginType.Email) {
      // 查看该用户是否存在
      user = await UserModel.findOne({
        where: {
          email: v.get('body.email')
        }
      })
    } else {
      // 查看该用户是否存在
      user = await UserModel.findOne({
        where: {
          username: v.get('body.username')
        }
      })
    }

    // 用户不存在
    if (!user) {
      throw new AuthFailed(20005)
    }

    // 验证密码是否正确
    const correct = bcrypt.compareSync(v.get('body.password'), user.password)
    if (!correct) {
      throw new AuthFailed(20006) // 用户密码错误
    }
    return user
  }
}

export default UserDao
