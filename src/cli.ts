import path from 'path'
import prompts from 'prompts'
import yargs from 'yargs'
import { exec } from './util'

export async function getArgs() {
  const { argv } = yargs
    .option('host', {
      describe: 'remote host',
      alias: 'h',
      type: 'string'
    })
    .option('username', {
      describe: 'ssh user',
      alias: 'u',
      type: 'string'
    })
    .option('private-key-path', {
      describe: 'private key path',
      alias: 'k',
      type: 'string'
    })
    .option('port', {
      describe: 'ssh port',
      default: 22,
      type: 'number'
    })
    .option('sudo-password', {
      describe: 'ssh port',
      type: 'string'
    })

  let username = argv.username
  if (!username) {
    username = (await exec('whoami')).stdout.trim()
  }
  if (!username) {
    username = (await prompts({
      type: 'text',
      name: 'value',
      message: 'username:',
      style: 'text'
    })).value
  }

  let privateKeyPath: string = argv['private-key-path']
  if (!privateKeyPath) {
    const HOME_PATH = (await exec('echo $HOME')).stdout.trim()
    privateKeyPath = path.join(HOME_PATH, '.ssh', 'id_rsa')
  }

  let sudoPassword: string = argv['sudo-password']
  if (!sudoPassword) {
    const response = await prompts({
      type: 'text',
      name: 'value',
      message: '[sudo] Password:',
      style: 'password'
    })

    sudoPassword = response.value
  }

  return { host: argv.host, port: argv.port, sudoPassword, username, privateKeyPath }
}
