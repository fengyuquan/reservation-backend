import bcrypt from 'bcryptjs'
import { get, has } from 'lodash'
import { DataTypes, Model } from 'sequelize'
import sequelize from '../core/db'

class User extends Model {
  declare id: number
  declare username: string
  declare email: string
  declare nickname: string
  declare avatar: string
  declare password: string

  toJSON() {
    const origin = {
      id: this.id,
      username: this.username,
      email: this.email,
      nickname: this.nickname,
      avatar: this.avatar
    }
    if (has(this, 'groups')) {
      // 如果属于某个组，返回所有组信息
      return { ...origin, groups: get(this, 'groups', []) }
    } else if (has(this, 'permissions')) {
      // 如果不属于某个组，但是有权限信息，说明是超级管理员
      return {
        ...origin,
        admin: get(this, 'admin', false),
        permissions: get(this, 'permissions', [])
      }
    }
    return origin
  }

  static async resetPassword(user: User, password: string) {
    user.password = password
    await user.save()
  }
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true, // 主键
      autoIncrement: true // 自动增长
    },
    username: {
      type: DataTypes.STRING({ length: 30 }),
      allowNull: false,
      comment: '用户名，可用于登陆验证'
    },
    email: {
      type: DataTypes.STRING(128),
      allowNull: false,
      comment: '邮箱，可用于登陆验证'
    },
    password: {
      type: DataTypes.STRING,
      set(val: string) {
        const salt = bcrypt.genSaltSync(10)
        const pwd = bcrypt.hashSync(val, salt)
        this.setDataValue('password', pwd)
      },
      allowNull: false
    },
    nickname: {
      type: DataTypes.STRING({ length: 30 }),
      comment: '用户昵称'
    },
    avatar: {
      // 用户默认生成图像，为null
      type: DataTypes.STRING({ length: 500 }),
      comment: '头像url'
    }
  },
  {
    sequelize,
    tableName: 'sys_user',
    modelName: 'user',
    indexes: [
      {
        name: 'username_email',
        unique: true,
        fields: ['username', 'email']
      }
    ]
  }
)

export { User as UserModel }
