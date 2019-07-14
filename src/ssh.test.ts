import { Client } from 'ssh2'
import * as ssh from './ssh'
import * as inner from './inner/ssh'

test('ssh params', () => {
  const functions = ['start']
  expect(Object.keys(ssh).length).toStrictEqual(functions.length)
})

test('ssh connect', async () => {
  const innerConnectMock = jest.spyOn(inner, 'connect')
  innerConnectMock.mockResolvedValue('mocked')

  const host = '192.168.11.1'
  const username = 'user'
  const taskFunction = jest.fn()

  await ssh.connect({
    host: host,
    username: username,
    privateKey: Buffer.from('key'),
    sudoPassword: 'password',
    task: taskFunction
  })

  expect(innerConnectMock.mock.calls.length).toStrictEqual(1)
  const [client, config, task] = innerConnectMock.mock.calls[0]
  expect(client instanceof Client).toStrictEqual(true)
  expect(config.host).toStrictEqual(host)
  expect(config.username).toStrictEqual(username)
  expect(task).toStrictEqual(taskFunction)
})
