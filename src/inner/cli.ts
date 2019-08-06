import path from 'path'
import fs from 'fs'
import yargs from 'yargs'
import SSHConfig from 'ssh-config'
import { exec } from '../util'

export async function getHomePath() {
  try {
    const { stdout } = await exec('echo $HOME')
    return stdout.trim()
  } catch (e) {
    return null
  }
}

export async function getSshConfig(homePath: string) {
  if (!homePath) {
    return []
  }
  try {
    const sshConfigFile = await fs.promises.readFile(path.join(homePath, '.ssh', 'config'), { encoding: 'utf8' })
    const sshConfig = SSHConfig.parse(sshConfigFile)
    return sshConfig
  } catch (e) {
    return []
  }
}

export async function parseSshConfig(
  host: string,
  options: { home: string }
): Promise<{ user: string; host: string; port: number; identityFile: string }> {
  if (!host) {
    return { host: null, user: null, port: null, identityFile: null }
  }

  const conf = await getSshConfig(options.home)

  const found = conf.find({ Host: host })
  if (!found) {
    return { user: null, host: host, port: null, identityFile: null }
  }

  const config = {
    user: null,
    host: host,
    port: null,
    identityFile: null
  }

  for (const line of found.config) {
    if (line.param === 'HostName') {
      config.host = line.value
    } else if (line.param === 'User') {
      config.user = line.value
    } else if (line.param === 'Port') {
      config.port = parseInt(line.value, 10)
    } else if (line.param === 'IdentityFile') {
      config.identityFile = line.value
    }
  }
  return config
}

export function getArgv() {
  return yargs
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
    }).argv
}
