export default {
  log4j: {
    logDir: '',
    logName: 'default.log'
  },
  database: {
    dbName: 'koa-ts-template',
    host: 'localhost',
    port: 3306,
    username: 'root',
    password: '123456'
  },
  security: {
    secretKey: 'sdqadsdadsdsa',
    expiresIn: 60 * 60 * 24 * 30
  }
}
