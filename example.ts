#!/usr/bin/env node

/* eslint-disable no-console */

import { TaskFunction, connect } from './src/index'

const deploy: TaskFunction = async ({ local, remote }) => {
  await local('ls -la ~/', { cwd: __dirname })
  await remote('sudo ls -la /home')
}

connect({
  host: '192.168.11.1',
  username: 'username',
  privateKey: require('fs').readFileSync(process.env.KEY),
  sudo_password: '123456',
  task: deploy
})
  .then(() => console.log('done'))
  .catch(console.error)
