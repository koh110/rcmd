import path from 'path'
import prompts from 'prompts'
import yargs from 'yargs'
import { exec } from './util'
import { getHomePath, parseSshConfig } from './inner/cli'

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

  const home = await getHomePath()
  const parsed = await parseSshConfig(argv.host, { home })

  const host = parsed.host ? parsed.host : argv.host

  let username = argv.username ? argv.username : parsed.user
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
    privateKeyPath = path.join(home, '.ssh', 'id_rsa')
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

  return { host: host, port: argv.port, sudoPassword, username, privateKeyPath }
}
