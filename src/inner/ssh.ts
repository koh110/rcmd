import { Client } from 'ssh2'
import { ExecOptions } from 'child_process'
import { promises as fsPromises } from 'fs'
import { exec } from '../util'

import { Config, TaskFunction, RemoteCmd, RemoteCmdResponse } from '../ssh'

export async function convertConfig(config: Config): Promise<Config> {
  let privateKey = config.privateKey
  if (!privateKey && config.privateKeyPath) {
    privateKey = await fsPromises.readFile(config.privateKeyPath)
  }

  const port = config.port ? config.port : 22

  return { ...config, port, privateKey }
}

export function connect(conn: Client, config: Config, task: TaskFunction, remote: RemoteCmd) {
  return new Promise((resolve, reject) => {
    conn
      .on('ready', () => {
        task({ config, local: localCmd, remote })
          .then(d => {
            conn.end()
            resolve(d)
          })
          .catch(e => {
            conn.end()
            reject(e)
          })
      })
      .on('error', e => {
        reject(e)
      })

    const connectConfig = { ...config }
    delete connectConfig.task
    delete connectConfig.sudoPassword
    delete connectConfig.privateKeyPath
    conn.connect(connectConfig)
  })
}

export type LocalCmdOptions = {
  stdout?: import('stream').Writable
} & ExecOptions

export async function localCmd(cmd: string, options: LocalCmdOptions): Promise<{ stdout; stderr }> {
  const stdout = options.stdout ? options.stdout : process.stdout
  stdout.write(cmd + '\n')
  const res = await exec(cmd, options)
  stdout.write(res.stdout + '\n')
  return { stdout: res.stdout, stderr: res.stderr }
}

export type RemoteCmdOptions = {
  stdout?: import('stream').Writable
  stderr?: import('stream').Writable
}

export function remoteCmd(conn: Client, cmd: string, password: string, options?: RemoteCmdOptions): RemoteCmdResponse {
  const stdout = options && options.stdout ? options.stdout : process.stdout
  const stderr = options && options.stderr ? options.stderr : process.stderr
  stdout.write(cmd + '\n')
  return new Promise((resolve, reject) => {
    try {
      conn.exec(cmd, { pty: true }, (err, stream) => {
        if (err) return reject(err)

        let out = ''
        stream
          .on('close', (code, signal) => {
            const res = { code, signal, stdout: out }
            stdout.write('\n')
            if (code === 0) {
              resolve(res)
            } else {
              reject(res)
            }
          })
          .on('data', data => {
            const str = data.toString('utf8')
            stdout.write(data)
            out += data
            if (cmd.includes('sudo') && str.toLowerCase().includes('password')) {
              stream.write(password + '\n')
            }
          })
          .stderr.on('data', data => {
            stderr.write(data + '\n')
            reject(data)
          })
      })
    } catch (e) {
      reject(e)
    }
  })
}
