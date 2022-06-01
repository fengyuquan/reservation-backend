import codes from './exception-code'

class HttpException extends Error {
  status = 500
  code = 9999
  message: string = codes[this.code]

  constructor(code: number) {
    super()
    this.code = code
    this.message = codes[this.code]
  }
}

/**
 * 成功
 */
class Success extends HttpException {
  constructor() {
    super(0)
    this.status = 200
  }
}

/**
 * 禁止操作，因为可能是多种原因导致被禁止操作，所以需要动态传入code
 */
class Forbidden extends HttpException {
  constructor(code: number) {
    super(code)
    this.status = 403
  }
}

/**
 * 资源找不到
 */
class NotFound extends HttpException {
  constructor(code = 30001) {
    super(code)
    this.status = 404
  }
}

/**
 * 通用参数校验异常，message信息由参数校验器生成再传入
 */
class ParameterException extends HttpException {
  constructor(message: string) {
    super(10002)
    this.status = 400
    this.message = message
  }
}

/**
 * 认证失败, 存在多个原因认证失败，所以传入code
 */
class AuthFailed extends HttpException {
  constructor(code = 20001) {
    super(code)
    this.status = 401
  }
}

/**
 * 用户未被授权
 */
class UnAuthenticated extends HttpException {
  constructor(code = 20002) {
    super(code)
    this.status = 401
  }
}

/**
 * 令牌失效或损坏
 */
class InvalidToken extends HttpException {
  constructor() {
    super(20003)
    this.status = 401
  }
}

/**
 * 令牌过期
 */
class ExpiredToken extends HttpException {
  constructor() {
    super(20004)
    this.status = 422
  }
}

/**
 * 请求地址错误
 */
class WrongUrlException extends HttpException {
  constructor() {
    super(30002)
    this.status = 400
  }
}

export {
  HttpException,
  Forbidden,
  NotFound,
  ParameterException,
  AuthFailed,
  UnAuthenticated,
  Success,
  InvalidToken,
  ExpiredToken,
  WrongUrlException
}
