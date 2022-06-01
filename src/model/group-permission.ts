import { DataTypes, Model } from 'sequelize'
import sequelize from '../core/db'

class GroupPermission extends Model {
  declare id: number
  declare group_id: number
  declare permission_id: number
}

GroupPermission.init(
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
    permission_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '权限id'
    }
  },
  {
    sequelize,
    timestamps: false,
    tableName: 'sys_group_permission',
    modelName: 'group_permission',
    indexes: [
      {
        name: 'group_id_permission_id',
        using: 'BTREE',
        fields: ['group_id', 'permission_id']
      }
    ]
  }
)

export { GroupPermission as GroupPermissionModel }
