import { IRouterContext } from 'koa-router'
import { UserModel } from '../model/user'

interface IUserContext extends IRouterContext {
  currentUser?: UserModel | null
  json?: (obj: unknown) => void
  success?: (obj: unknown) => void
}
export { IUserContext }
