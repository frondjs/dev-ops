module.exports = {
  env: {
    doc: 'The application environment.',
    default: 'development',
    env: 'NODE_ENV'
  },
  port: {
    doc: 'The port of the application.',
    default: ':8080',
    env: 'FROND_PORT'
  },
  produrl: {
    doc: 'The production url. Required even if in development.',
    default: 'http://localhost:8080',
    env: 'FROND_PRODURL'
  },
  prodServerConnStr: {
    doc: 'SSH connection string including destination path.',
    default: '',
    env: 'FROND_PROD_SERVER_CONN_STR'
  }
}
