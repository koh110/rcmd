#!/usr/bin/env node

/**
 * ts-node ./example.ts -u userName -h 192.168.11.1
 */

import * as rmtcmd from './src/index'

const deploy: rmtcmd.TaskFunction = async ({ local, remote }) => {
  await local('ls -la ~/', { cwd: __dirname })
  await remote('sudo ls -la /home')
}

async function main() {
  const { host, username, privateKeyPath, sudoPassword } = await rmtcmd.cli.getArgs()

  const privateKey = require('fs').readFileSync(privateKeyPath)

  await rmtcmd.connect({
    host,
    username,
    privateKey,
    sudoPassword,
    task: deploy
  })
}

main().catch(console.error)
