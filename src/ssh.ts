import { Client, ConnectConfig } from 'ssh2'
import { promises as fsPromises } from 'fs'
import * as ssh from './inner/ssh'

export type Config = ConnectConfig & {
  privateKeyPath?: string
  task: TaskFunction
  sudoPassword?: string
}

export type RemoteCmdResponse = Promise<{ code: number; signal: boolean; stdout: string }>
export type RemoteCmd = (cmd: string) => RemoteCmdResponse
export type LocalCmd = typeof ssh.localCmd

export type TaskFunction = ({
  config,
  local,
  remote
}: {
  config: Config
  local: LocalCmd
  remote: RemoteCmd
}) => Promise<void>

export async function connect(config: Config) {
  let privateKey = config.privateKey
  if (!privateKey && config.privateKeyPath) {
    privateKey = await fsPromises.readFile(config.privateKeyPath)
  }

  const { task, sudoPassword } = config

  config = await ssh.convertConfig(config)

  const conn = new Client()

  const remote: RemoteCmd = (cmd: string) => ssh.remoteCmd(conn, cmd, sudoPassword)

  return await ssh.connect(conn, config, task, remote)
}
