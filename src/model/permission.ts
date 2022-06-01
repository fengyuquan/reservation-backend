import { DataTypes, Model, Op } from 'sequelize'
import config from '../config'
import sequelize from '../core/db'
import { routerMetaInfo } from '../lib/router'
import { MountType } from '../lib/type'
import { GroupPermissionModel } from './group-permission'

class Permission extends Model {
  declare id: number
  declare name: string
  declare module: string
  declare mount: number

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      module: this.module
    }
  }

  static async initPermission() {
    let transaction
    try {
      transaction = await sequelize.transaction() // 创建事务
      const info = Array.from(routerMetaInfo.values()) // 获取所有路由元信息
      const permissions = await this.findAll() // 获取数据库中的所有权限条目

      // 1 遍历routerMetaInfo（路由元信息）的权限是否存在数据库中，如果不存在，则创建
      for (const { permissionName, moduleName, mount } of info) {
        const exist = permissions.find(
          (p) => p.name === permissionName && p.module === moduleName
        )

        // 如果不存在，则创建
        if (!exist) {
          await this.create(
            {
              name: permissionName,
              module: moduleName,
              mount
            },
            {
              transaction
            }
          )
        }
      }

      // 2 遍历数据库中的permissions是否存在路由info中，如果不存在，则说明这条路由不存在了，需要卸载数据库中的条目，同时分配了该权限的组也要删除该权限
      const unmountPermissionIds = []
      for (const permission of permissions) {
        const exist = info.find(
          (meta) =>
            meta.permissionName === permission.name &&
            meta.moduleName === permission.module
        )
        // 如果能找到这个 meta 则挂载之，否则卸载之（因为这条路由可能不存在了）
        if (exist) {
          if (permission.mount === MountType.Mount) continue // 如果已经挂载了，则跳过
          permission.mount = MountType.Mount
        } else {
          unmountPermissionIds.push(permission.id)
          if (permission.mount === MountType.Unmount) continue // 如果已经卸载了，则跳过
          permission.mount = MountType.Unmount
        }
        await permission.save({
          transaction
        })
      }

      // 3 解除分配未挂载权限的组关联 sys-group-permission表
      if (unmountPermissionIds.length) {
        await GroupPermissionModel.destroy({
          where: {
            permission_id: {
              [Op.in]: unmountPermissionIds
            }
          }, 
          transaction
        })
      }

      // 4 提交事务
      await transaction.commit()
    } catch (error) {
      if (config.env === 'development') {
        console.log(error)
      }
      // 5 回滚事务
      if (transaction) await transaction.rollback()
    }
  }
}

Permission.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING({ length: 60 }),
      comment: '权限名称，如：删除用户',
      allowNull: false
    },
    module: {
      type: DataTypes.STRING({ length: 60 }),
      comment: '权限所属模块，例如：人员管理',
      allowNull: false
    },
    mount: {
      type: DataTypes.BOOLEAN,
      comment: '0 关闭，1 开启',
      defaultValue: 1
    }
  },
  {
    sequelize,
    tableName: 'sys_permission',
    modelName: 'permission'
  }
)

export { Permission as PermissionModel }
