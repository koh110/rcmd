jest.spyOn(console, 'log').mockImplementation()
jest.spyOn(console, 'error').mockImplementation()

const readFile = jest.fn().mockResolvedValue(Buffer.from('private key'))

jest.mock('fs', () => ({
  promises: {
    readFile: readFile
  }
}))

import { Client, ExecOptions, ClientChannel } from 'ssh2'
import { Config, TaskFunction } from '../ssh'
import * as ssh from './ssh'

test('covertConfig', async () => {
  const config: Config = {
    privateKeyPath: '/test',
    task: async () => {}
  }
  const converted = await ssh.convertConfig(config)

  expect(Buffer.isBuffer(converted.privateKey)).toBe(true)
  // default
  expect(converted.port).toStrictEqual(22)
})

test('covertConfig privateKey', async () => {
  const privateKey = Buffer.from('aaa')

  const config: Config = {
    privateKey: Buffer.from('aaa'),
    task: async () => {}
  }
  const converted = await ssh.convertConfig(config)

  expect(converted.privateKey.toString()).toBe(privateKey.toString())
})

test('ssh connect', async () => {
  const taskInner = jest.fn()
  const task: TaskFunction = async ({ config, local, remote }) => {
    expect(typeof config).toBe('object')
    expect(typeof local).toBe('function')
    expect(typeof remote).toBe('function')
    taskInner()
  }

  const host = '192.168.11.1'
  const username = 'user'

  const client = new Client()
  const connect = jest.fn()

  client.connect = function(config: Config) {
    this.emit('ready')
    connect(config)
  }
  ;(client as any).exec = function(
    command: string,
    options: ExecOptions,
    callback: (err: Error, channel: ClientChannel) => void
  ) {
    callback(null, null)
    return true
  }

  const end = jest.fn()
  client.end = end

  const remote = jest.fn()

  await ssh.connect(
    client,
    {
      host: host,
      username: username,
      privateKeyPath: '/privatekeypath',
      sudoPassword: 'password',
      task: task
    },
    task,
    remote
  )

  expect(connect.mock.calls.length).toStrictEqual(1)

  const args = connect.mock.calls[0][0]
  expect(args.host).toStrictEqual(host)
  expect(args.username).toStrictEqual(username)
  expect(args.task).toBe(undefined)
  expect(args.sudoPassword).toBe(undefined)
  expect(args.privateKeyPath).toBe(undefined)

  expect(end.mock.calls.length).toStrictEqual(1)
})
