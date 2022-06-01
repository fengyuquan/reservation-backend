import { DataTypes, Model } from 'sequelize'
import sequelize from '../core/db'

class UserGroup extends Model {
  declare id: number
  declare group_id: number
  declare user_id: number
}

UserGroup.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    group_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '分组id'
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '用户id'
    }
  },
  {
    sequelize,
    timestamps: false,
    tableName: 'sys_user_group',
    modelName: 'user_group',
    indexes: [
      {
        name: 'user_id_group_id',
        using: 'BTREE',
        fields: ['user_id', 'group_id']
      }
    ]
  }
)

export { UserGroup as UserGroupModel }
