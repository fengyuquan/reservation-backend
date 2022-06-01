const codes: { [key: string]: string } = {}

codes[0] = 'ok'
codes[9999] = '服务器未知异常'

// 通用错误
codes[10001] = '通用错误'
codes[10002] = '通用参数校验错误'

// 登陆，注册，身份校验
codes[20001] = '身份认证失败'
codes[20002] = '权限不足'
codes[20003] = '令牌失效或损坏'
codes[20004] = '令牌已过期'
codes[20005] = '用户不存在'
codes[20006] = '用户密码错误'
codes[20007] = '请在header中携带Bearer token访问'
codes[20008] = '认证头字段解析失败'
codes[20009] = '用户名已经存在'
codes[20010] = '邮箱已经存在'

// 请求资源相关
codes[30001] = '资源找不到'
codes[30002] = '请求地址不存在'

// 禁止访问相关
codes[40001] = '用户还没有分配组，请联系管理员分配'
codes[40002] = '用户所在组不存在，请联系管理员'

export default codes
