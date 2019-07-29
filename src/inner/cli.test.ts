jest.mock('../util')

const readFileMock = jest.fn().mockResolvedValue(Buffer.from('private key'))

jest.mock('fs', () => ({
  promises: {
    readFile: readFileMock
  }
}))

import { exec } from '../util'
import * as cli from './cli'

test('getHomePath', async () => {
  const execMock = exec as jest.Mock
  execMock.mockClear()

  const stdout = '/home/test'
  execMock.mockResolvedValue({ stdout })

  const getHomePath = await cli.getHomePath()

  expect(getHomePath).toStrictEqual(stdout)
})

test('getHomePath error', async () => {
  const execMock = exec as jest.Mock
  execMock.mockClear()

  execMock.mockRejectedValue('rejected')

  const getHomePath = await cli.getHomePath()

  expect(getHomePath).toStrictEqual(null)
})

test('getSshConfig', async () => {
  readFileMock.mockClear()

  const conf = `IdentityFile ~/.ssh/id_rsa

Host test
  HostName test.com

Host *
  User foo
  ForwardAgent true
  `

  readFileMock.mockResolvedValue(conf)

  const sshConfig = await cli.getSshConfig('/path/to/ssh/config')

  expect(Array.isArray(sshConfig)).toStrictEqual(true)
})

test('getSshConfig error', async () => {
  let res = await cli.getSshConfig(null)
  expect(res.length).toStrictEqual(0)

  readFileMock.mockClear()
  readFileMock.mockRejectedValue('rejected')

  res = await cli.getSshConfig(null)
  expect(res.length).toStrictEqual(0)
})

test('getHost', async () => {
  const conf = `IdentityFile ~/.ssh/id_rsa

Host test
  HostName test.com

Host foo
  User bar
  ForwardAgent true
  `

  readFileMock.mockResolvedValue(conf)
  const home = '/path/to/ssh/config'

  let res = await cli.parseSshConfig('test', { home })
  expect(res.host).toStrictEqual('test.com')
  expect(res.user).toStrictEqual(null)

  res = await cli.parseSshConfig('foo', { home })
  expect(res.host).toStrictEqual('foo')
  expect(res.user).toStrictEqual('bar')

  res = await cli.parseSshConfig('hoge', { home })
  expect(res.host).toStrictEqual('hoge')
  expect(res.user).toStrictEqual(null)
})
