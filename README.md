# FrondJS Dev Ops Package
Build, test and distribute with Frond!

## OS Dependencies
1. `tar`
2. `openssl`
3. `rsync`
4. `md5sum`
5. `gitflow-avh` (If you use git in your project.)

**On mac**, just install:
1. `brew install md5sha1sum`
2. `brew install gitflow-avh`

It will create `~/.frondjs` directory and will install [@frondjs/dev-server](https://github.com/frondjs/dev-server) package upon installation.

## Install
```sh
npm i -g @frondjs/dev-ops
```

## Create A Project
You project may or may not have git. Frond just has features for git based development but it is okey if you'r not using it.
```sh
frond create
```

## Configure
Frond keep configuration files inside `~/.frondjs` folder. There should be a config file for each environment you work. Default values are inside `~/.frondjs/project-name-development.config.json`. There is also a `~/.frondjs/project-name-production.config.json` file. These two files generated automatically by `create` script for convenience. Configuration params are loaded by the excellent [https://github.com/mozilla/node-convict](convict) library according to the environment you specify while sending commands. (`NODE_ENV=production frond deploy` for example.) The default value for the environment is **development**.

### Configure For Development
Important settings while working with development environment:
```js
{
  // Production url setting is used by ssr script and can also be used inside the app config.
  "produrl": "https://yoursite.com",
  // Local server will be available on this port.
  "port": ":8080"
}
```

### Configure For Production And Any Other Environment
Important settings while working with production (and any other) environment:
```js
{
  // Production url setting is used by ssr script and can also be used inside the app config.
  "produrl": "https://yoursite.com",
  // Versioning scheme is calver or semver.
  "versioningScheme": "calver",
  // You may change the format according to the scheme.
  "versioningFormat": "yy.mm.micro.dev",
  // ssh remote server connection string
  "serverConnStr": "user@ip",
  // The path that holds all deploys in the remote server
  "serverDistPath": "/home/user/dist",
  // ssh remote server connection string for sudo based operations
  "serverSudoConnStr": "sudo_user@ip",
  // Email address that will be pass to the certbot while issuing ssl certs.
  "certbotEmail": "murat@gozel.com.tr",
  // Release announcements will be made in this language. (en or tr)
  "devopsLanguage": "en",
  // Email addresses that will receive release announcements.
  "releaseRecipients": "email1,email2,email3",

  // Configure aws ses for sending email
  "awsSesSender": "",
  "awsSesRegion": "",
  "awsSesAccessKeyId": "",
  "awsSesSecretAccessKey": "",

  // Configure gmail for sending email
  "gmailSender": "",
  "gcloudProject": "",
  "gmailApplicationCredentials": ""
}
```

### Configure GIT
Frond supports both [https://github.com/muratgozel/node-calver](calver) and [https://github.com/npm/node-semver](semver) as versioning scheme. The default scheme
is calver and the default format is **yy.mm.micro.dev**. You can change these settings in the config file.

First of all, make sure that your git tool configured correctly:
```sh
git config --global user.email "your@email.address"
git config --global user.name "Your Name"
git config --global core.editor 'vim'
```

## Start Developing
**If your project based on git**, create a release tag before making any changes:
```sh
frond git --release --tag=dev
```
**dev** is the default tag when you don't specify the tag flag according to your versioning format. After this command execution, the new version of your project will be something like **21.3.0-dev.1**. If we were specified **micro** as tag, then it would be **21.3.1**

To learn more about the conventions in naming tags, please refer the documentation of node-calver and node-semver libraries.

Start developing:
```sh
frond develop
```
This will start development server and app will reload itself on any change in the codebase.

When you'r done with the changes finish the release:
```sh
frond git --release --finish
```

**If you have enabled auto-deploy, frond will deploy your project and it will be available at some domain according to the settings you set in project config.**

## Initial Deploy
```sh
frond ideploy
```

## Deploy
```sh
NODE_ENV=production frond deploy
```

## Announce
```sh
NODE_ENV=production frond announce
```
