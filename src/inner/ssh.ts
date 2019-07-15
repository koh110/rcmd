/* eslint-disable no-console */

import { Client } from 'ssh2'
import { ExecOptions } from 'child_process'
import { promises as fsPromises } from 'fs'
import { exec } from '../util'

import { Config, TaskFunction, RemoteCmd } from '../ssh'

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
        console.log('ssh client ready')
        task({ config, local: localCmd, remote })
          .then(d => {
            console.log('ssh client close')
            conn.end()
            resolve(d)
          })
          .catch(e => {
            console.error(e)
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

export async function localCmd(cmd: string, options: ExecOptions): Promise<{ stdout; stderr }> {
  console.log(cmd)
  const { stdout, stderr } = await exec(cmd, options)
  console.log(stdout)
  return { stdout, stderr }
}

export function remoteCmd(
  conn: Client,
  cmd: string,
  password: string = null
): Promise<{ code: number; signal: boolean; stdout: string }> {
  console.log(cmd)
  return new Promise((resolve, reject) => {
    conn.exec(cmd, { pty: true }, (err, stream) => {
      if (err) return reject(err)

      const res = []
      stream
        .on('close', (code, signal) => {
          resolve({ code, signal, stdout: res.join('\n') })
        })
        .on('data', data => {
          const stdout = data.toString('utf8')
          console.log(stdout)
          res.push(stdout)
          if (cmd.includes('sudo') && stdout.toLowerCase().includes('password')) {
            stream.write(password + '\n')
          }
        })
        .stderr.on('data', data => {
          console.error(data)
          reject(data)
        })
    })
  })
}
