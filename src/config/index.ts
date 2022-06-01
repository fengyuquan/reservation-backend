import secure from './secure'

export default {
  env: process.env.NODE_ENV,
  port: process.env.PORT ?? '3000',
  apiDir: 'src/api',
  ...secure
}
