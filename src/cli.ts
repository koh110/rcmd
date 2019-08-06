import path from 'path'
import prompts from 'prompts'
import { exec } from './util'
import { getArgv, getHomePath, parseSshConfig } from './inner/cli'

export async function getArgs() {
  const argv = getArgv()
  const home = await getHomePath()
  const parsed = await parseSshConfig(argv.host, { home })

  const host = parsed.host ? parsed.host : argv.host
  const port = parsed.port ? parsed.port : argv.port

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
  if (!privateKeyPath && parsed.identityFile) {
    if (parsed.identityFile.startsWith('~/')) {
      privateKeyPath = path.join(home, parsed.identityFile.slice(2))
    } else {
      privateKeyPath = parsed.identityFile
    }
  }
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

  return { host, port, sudoPassword, username, privateKeyPath }
}
