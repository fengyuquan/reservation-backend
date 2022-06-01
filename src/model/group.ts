import { get, has } from 'lodash'
import { DataTypes, Model } from 'sequelize'
import sequelize from '../core/db'

class Group extends Model {
  declare id: number
  declare name: string
  declare info: string
  declare level: number

  toJSON() {
    const origin = {
      id: this.id,
      name: this.name,
      info: this.info
    }
    if (has(this, 'permissions')) {
      return { ...origin, permissions: get(this, 'permissions', []) }
    }
    return origin
  }
}

Group.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING({ length: 60 }),
      allowNull: false,
      unique: true,
      comment: '分组名称，例如：搬砖者'
    },
    info: {
      type: DataTypes.STRING({ length: 255 }),
      allowNull: true,
      comment: '分组信息：例如：搬砖的人'
    },
    level: {
      type: DataTypes.INTEGER({ length: 2 }),
      defaultValue: 3,
      comment: '分组级别 1：root 2：guest 3：user（root、guest分组只能存在一个)'
    }
  },
  {
    sequelize,
    tableName: 'sys_group',
    modelName: 'group'
  }
)

export { Group as GroupModel }
