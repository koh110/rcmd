import path from 'path'
import fs from 'fs'
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

export async function parseSshConfig(host: string, options: { home: string }) {
  if (!host) {
    return { host: null, user: null }
  }

  const conf = await getSshConfig(options.home)

  const found = conf.find({ Host: host })
  if (!found) {
    return { user: null, host: host }
  }

  let confUser: string = null
  let confHost: string = host
  for (const line of found.config) {
    if (line.param === 'HostName') {
      confHost = line.value
    } else if (line.param === 'User') {
      confUser = line.value
    }
  }
  return { user: confUser, host: confHost }
}
