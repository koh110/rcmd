import { Client, ConnectConfig } from 'ssh2'
import { ExecOptions } from 'child_process'
import { exec } from './util'

/* eslint-disable no-console */

type config = ConnectConfig & {
  task: TaskFunction
  sudoPassword?: string
}

type RemoteCmd = (cmd: string, password?: string) => Promise<{ code: number; signal: boolean }>
type LocalCmd = typeof localCmd

export type TaskFunction = ({ local, remote }: { local: LocalCmd; remote: RemoteCmd }) => Promise<void>

export function connect(args: config) {
  const conn = new Client()

  const { task, sudoPassword } = args
  const remote: RemoteCmd = (cmd: string) => remoteCmd(conn, cmd, sudoPassword)

  return new Promise((resolve, reject) => {
    conn
      .on('ready', () => {
        console.log('ssh client ready')
        task({ local: localCmd, remote })
          .catch(e => {
            console.error(e)
          })
          .finally(() => {
            console.log('ssh client close')
            conn.end()
            resolve()
          })
      })
      .on('error', e => {
        reject(e)
      })

    delete args.task
    delete args.sudoPassword
    args.port = args.port ? args.port : 22
    conn.connect(args)
  })
}

async function localCmd(cmd: string, options: ExecOptions): Promise<Buffer | string> {
  console.log(cmd)
  const stdout = await exec(cmd, options)
  console.log(stdout)
  return stdout
}

function remoteCmd(conn: Client, cmd: string, password: string = null): Promise<{ code: number; signal: boolean }> {
  console.log(cmd)
  return new Promise((resolve, reject) => {
    conn.exec(cmd, { pty: true }, (err, stream) => {
      if (err) return reject(err)

      stream
        .on('close', (code, signal) => {
          conn.end()
          resolve({ code, signal })
        })
        .on('data', data => {
          const stdout = data.toString('utf8')
          console.log(stdout)
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
