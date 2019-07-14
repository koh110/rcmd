#!/usr/bin/env node

/**
 * ts-node ./example.ts -u userName -h 192.168.11.1
 */

import path from 'path'
import * as rmtcmd from './src/index'

const deploy: rmtcmd.TaskFunction = async ({ config, local, remote }) => {
  await local('ls -la ./dist', { cwd: __dirname })

  const target = `/home/${config.username}/rmtcmd`

  await remote(`sudo mkdir -p ${target}`)
  await remote(`sudo chmod 775 ${target}`)
  await remote(`sudo chown ${config.username}:${config.username} ${target}`)

  const src = path.join(__dirname, 'dist', 'src')

  await local(
    [
      `rsync -av`,
      `--exclude='node_modules'`,
      `-e 'ssh -i ${config.privateKeyPath}'`,
      `${src}/`,
      `${config.username}@${config.host}:${target}`
    ].join(' '),
    {
      cwd: __dirname
    }
  )

  await remote(`ls -la ${target}`)
}

async function main() {
  const { host, username, privateKeyPath, sudoPassword } = await rmtcmd.cli.getArgs()

  await rmtcmd.connect({
    host,
    username,
    privateKeyPath,
    sudoPassword,
    task: deploy
  })
}

main().catch(console.error)
