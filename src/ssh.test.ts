import EventEmitter from 'events'

const connect = jest.fn()
const end = jest.fn()

class ClientMock extends EventEmitter {
  connect(args) {
    this.emit('ready')
    connect(args)
  }

  exec(cmd, options, callback) {
    callback(null, 'a')
  }

  end = end
}

jest.mock('ssh2', () => ({
  Client: ClientMock
}))

import * as ssh from './ssh'

import { TaskFunction } from './ssh'

test('ssh params', () => {
  const functions = ['start']
  expect(Object.keys(ssh).length).toStrictEqual(functions.length)
})

test('ssh start', async () => {
  const taskInner = jest.fn()
  const task: TaskFunction = async ({ local, remote }) => {
    expect(typeof local).toBe('function')
    expect(typeof remote).toBe('function')
    taskInner()
  }

  const host = '192.168.11.1'
  const username = 'user'

  await ssh.connect({
    host: host,
    username: username,
    privateKey: Buffer.from('key'),
    sudoPassword: 'password',
    task: task
  })

  expect(connect.mock.calls.length).toStrictEqual(1)
  const args = connect.mock.calls[0][0]
  expect(args.host).toStrictEqual(host)
  expect(args.username).toStrictEqual(username)
  // default
  expect(args.port).toStrictEqual(22)
  expect(taskInner.mock.calls.length).toStrictEqual(1)

  expect(end.mock.calls.length).toStrictEqual(1)
})
