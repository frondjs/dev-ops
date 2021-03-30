module.exports = {
  env: {
    doc: 'The application environment.',
    default: 'development',
    env: 'NODE_ENV'
  },
  port: {
    doc: 'The port of the application. Used in development.',
    default: ':8080',
    env: 'FROND_PORT'
  },
  produrl: {
    doc: 'The production url. Required even if in development.',
    default: 'http://localhost:8080',
    env: 'FROND_PRODURL'
  },
  versioningScheme: {
    doc: 'Either calver or semver.',
    default: 'calver',
    env: 'FROND_VERSIONING_SCHEME'
  },
  versioningFormat: {
    doc: 'The version format you would like to go with.',
    default: 'yy.mm.micro.dev',
    env: 'FROND_VERSIONING_FORMAT'
  },
  serverConnStr: {
    doc: 'Server connection string to make deploys in ssh format.',
    default: '',
    env: 'FROND_SERVER_CONN_STR'
  },
  serverDistPath: {
    doc: 'The path where your project resides.',
    default: '',
    env: 'FROND_SERVER_DIST_PATH'
  },
  serverSudoConnStr: {
    doc: 'Used in the remote server when making an initial deploy. It is serverConnStr by default.',
    default: '',
    env: 'FROND_SERVER_OS_USER'
  },
  certbotEmail: {
    doc: 'Email which will be sent to the letsencrypt while obtaining an ssl certificate.',
    default: '',
    env: 'FROND_CERTBOT_EMAIL'
  },
  devopsLanguage: {
    doc: 'Language of the emails and reports.',
    default: 'en',
    env: 'FROND_DEVOPS_LANGUAGE'
  },
  releaseRecipients: {
    doc: 'Comma seperated list of emails which will receive new release notifications.',
    default: '',
    env: 'FROND_RELEASE_RECIPIENTS'
  },
  awsSesSender: {
    doc: 'Sender email for AWS SES.',
    default: '',
    env: 'FROND_AWS_SES_SENDER'
  },
  awsSesRegion: {
    doc: 'AWS SES region.',
    default: '',
    env: 'FROND_AWS_SES_REGION'
  },
  awsSesAccessKeyId: {
    doc: 'AWS access key id.',
    default: '',
    env: 'FROND_AWS_SES_ACCESS_KEY_ID'
  },
  awsSesSecretAccessKey: {
    doc: 'AWS secret access key.',
    default: '',
    env: 'FROND_AWS_SES_SECRET_ACCESS_KEY'
  },
  gmailSender: {
    doc: 'Sender email for Gmail API.',
    default: '',
    env: 'FROND_GMAIL_SENDER'
  },
  gcloudProject: {
    doc: 'Gcloud project name for sending emails with Gmail API.',
    default: '',
    env: 'FROND_GCLOUD_PROJECT'
  },
  gmailApplicationCredentials: {
    doc: 'Filepath of the server to server credentials file.',
    default: '',
    env: 'FROND_APPLICATION_CREDENTIALS'
  }
}
