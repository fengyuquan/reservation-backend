import { get, has, set } from 'lodash'
import { Op } from 'sequelize'
import config from '../config'
import sequelize from '../core/db'
import { GroupLevel, MountType } from '../lib/type'
import { GroupModel } from '../model/group'
import { GroupPermissionModel } from '../model/group-permission'
import { PermissionModel } from '../model/permission'
import { UserModel } from '../model/user'
import { UserGroupModel } from '../model/user-group'
import {isRootAdmin} from '../utils'

class AdminDao {
  /**
   * 获取所有permission
   */
  async getAllPermissions() {
    // 找到数据库中所有已挂载的权限
    const permissions = await PermissionModel.findAll({
      where: {
        mount: MountType.Mount
      }
    })

    // 将所有权限按照“模块名”组织成map
    const result = new Map<string, unknown[]>()
    permissions.forEach((v) => {
      const item = {
        id: v.id,
        name: v.name,
        module: v.module
      }
      if (result.has(item.module)) {
        // 如果已经存在item.module这个key，则直接取到对应的数组值，插入item
        result.get(item.module)?.push(item)
      } else {
        // 否则创建这个key，并以【item】为初始值
        result.set(item.module, [item])
      }
    })

    return result
  }

  /**
   * 批量获取user。可选的传入groupId，则只返回属于该组的用户
   */
  async getUsers(page: number, num: number, groupId?: number) {
    const result: {
      users: UserModel[]
      total: number
    } = {
      users: [],
      total: 0
    }

    // 1 如果传入了组id，则只查找该组的用户
    if (groupId) {
      // 1.1 查看该组是否存在，存在则继续，不存在直接报错
      const group = await GroupModel.findByPk(groupId)
      if (!group) {
        // TODO 报错，该组不存在
        // throw new Error()
      }

      // 1.2 从user-group表中找到该组的所有用户id
      const userGroup = await UserGroupModel.findAll({
        where: {
          group_id: groupId
        }
      })

      // 1.3 通过用户id查找满足条件的users
      const userIds = userGroup.map((v) => v.user_id)
      const { rows, count } = await UserModel.findAndCountAll({
        where: {
          id: {
            [Op.in]: userIds
          }
        },
        offset: page * num,
        limit: num
      })

      // 1.4 设置返回结果
      result.users = rows
      result.total = count
    } else {
      // 2 查找所有用户
      // 2.1 查找限制数量的用户
      const { rows, count } = await UserModel.findAndCountAll({
        offset: page * num,
        limit: num
      })

      // 2.2 设置返回结果
      result.users = rows
      result.total = count
    }

    // 3 遍历result.users，找到用户的所有组信息
    for (const user of result.users) {
      const userGroup = await UserGroupModel.findAll({
        where: {
          user_id: user.id
        }
      })
      const groupIds = userGroup.map((v) => v.group_id)
      const groups = await GroupModel.findAll({
        where: {
          id: {
            [Op.in]: groupIds
          }
        }
      })
      // 在当前遍历到的user对象上，挂载groups信息
      set(user, 'groups', groups)
    }

    // 4 返回结果
    return result
  }

  /**
   * 批量获取groups,可选的传入level，则只返回属于该level的组
   */
  async getGroups(page: number, num: number, level?: string) {
    const result: {
      groups: GroupModel[]
      total: number
    } = {
      groups: [],
      total: 0
    }

    if (level) {
      if (!has(GroupLevel, level)) {
        // TODO 如果没找到该级别的组，则报错，不存在该级别的组
      } else {
        const { rows, count } = await GroupModel.findAndCountAll({
          where: {
            level: get(GroupLevel, level)
          },
          offset: page * num,
          limit: num
        })

        // 设置返回值
        result.groups = rows
        result.total = count
      }
    } else {
      const { rows, count } = await GroupModel.findAndCountAll({
        offset: page * num,
        limit: num
      })
      // 设置返回值
      result.groups = rows
      result.total = count
    }
    return result
  }

  /**
   * 通过组id获取组
   */
  async getGroup(id: number) {
    const group = await GroupModel.findByPk(id)
    if (!group) {
      // TODO 抛出组未找到的错误
    } else {
      // 查找该组拥有的权限
      const GroupPermission = await GroupPermissionModel.findAll({
        where: {
          group_id: id
        }
      })
      const permissionIds = GroupPermission.map((v) => v.permission_id)
      const permissions = await PermissionModel.findAll({
        where: {
          mount: MountType.Mount,
          id: {
            [Op.in]: permissionIds
          }
        }
      })

      // 在group上附加上permissions属性
      set(group, 'permissions', permissions)
      return group
    }
  }

  /**
   * 重设用户密码
   */
  async resetUserPassword(id: number, password = '123456a?') {
    const user = await UserModel.findByPk(id)
    if (!user) {
      // TODO 没有找到用户，抛出错误
    } else {
      await UserModel.resetPassword(user, password)
    }
  }

  /**
   * 禁用用户
   */
  async deleteUser(id: number) {
    const user = await UserModel.findByPk(id)
    if (!user) {
      // TODO 没有找到用户，抛出错误
    } else {
      if (await isRootAdmin(id)) {
        // TODO 如果是超级管理员, 抛出不能删除超级管理员的错误
      } else {
        // 开启事务，删除 用户，用户-组 中的条目
        let transaction
        try {
          transaction = await sequelize.transaction()
          // 软删除用户
          await user.destroy({
            transaction
          })
          // 找到这个用户所有的组，删除他们的关系
          await UserGroupModel.destroy({
            where: {
              user_id: id
            },
            transaction
          })
          await transaction.commit()
        } catch (error) {
          if (config.env === 'development') {
            console.log(error)
          }
          if (transaction) await transaction.rollback()
        }
      }
    }
  }

  /**
   * 改变用户所属组，为用户分配组
   */
  async changeUserGroups(id: number, groupIds: number[]) {
    // 1 查找用户
    const user = await UserModel.findByPk(id)
    if (!user) {
      // TODO 没有找到用户，抛出错误
    } else {
      // 判断他是否是超级管理员
      if (await isRootAdmin(id)) {
        // TODO 如果是超级管理员, 抛出不能删除超级管理员的错误
      } else {
        // 2.1 先判断传递过来的groupIds是否全部存在数据库中，并且还不能是超级管理员组
        for (const gId of groupIds) {
          const group = await GroupModel.findByPk(gId)

          if (!group || group.level === GroupLevel.Root) {
            // TODO 没有找到group，抛出错误
            throw new Error('传递组信息错误')
          }
        }

        let transaction
        try {
          // 2.2 开启事务，清空user-group中该用户的条目
          transaction = await sequelize.transaction()
          await UserGroupModel.destroy({
            where: {
              user_id: id
            },
            transaction
          })
          // 2.3 在user-group中新建条目
          for (const gId of groupIds) {
            await UserGroupModel.create(
              {
                user_id: id,
                group_id: gId
              },
              { transaction }
            )
          }

          await transaction.commit()
        } catch (error) {
          if (config.env === 'development') {
            console.log(error)
          }
          if (transaction) await transaction.rollback()
        }
      }
    }
  }

  /**
   * 创建组
   */
  async createGroup(name: string, info?: string, level = GroupLevel.User) {
    // TODO
    console.log(level)
  }

  /**
   * 更新组信息
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async updateGroup(name: string, info?: string, level?: number) {
    // TODO
  }

  /**
   * 更新组成员
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async updateGroupUsers(name: string, info?: string, level?: number) {
    // TODO
  }

  /**
   * 删除组
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async deleteGroup(id: number) {
    // TODO
  }

  /**
   * 调整小组的权限
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async updateGroupPermission(groupId: number, permissionIds: number[]) {
    // TODO
  }
}

export { AdminDao }
