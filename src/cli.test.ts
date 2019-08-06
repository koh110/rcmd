jest.mock('./inner/cli')

import { getArgv, getHomePath, parseSshConfig } from './inner/cli'
import * as cli from './cli'

beforeEach(() => {
  jest.resetAllMocks()
})

test('getArgs autocomplete from .ssh/config', async () => {
  const getArgvMock = getArgv as jest.Mock
  getArgvMock.mockReturnValue({ host: 'sshhost', 'sudo-password': 1111 })

  const getHomePathMock = getHomePath as jest.Mock
  getHomePathMock.mockResolvedValue('/home/username')

  const parseSshConfigMock = parseSshConfig as jest.Mock
  parseSshConfigMock.mockResolvedValue({
    user: 'useraaa',
    host: 'sshhost.com',
    port: 2222
  })

  const res = await cli.getArgs()

  expect(res.host).toStrictEqual('sshhost.com')
  expect(res.username).toStrictEqual('useraaa')
  expect(res.port).toStrictEqual(2222)
  expect(res.sudoPassword).toStrictEqual(1111)
})

test.each([
  [
    'default',
    { host: 'sshhost', 'sudo-password': 1111 },
    '/home/username',
    {
      identityFile: null
    },
    '/home/username/.ssh/id_rsa'
  ],
  [
    'relative path',
    { host: 'sshhost', 'sudo-password': 1111 },
    '/home/username',
    {
      identityFile: '~/.ssh/id_rsa_b'
    },
    '/home/username/.ssh/id_rsa_b'
  ],
  [
    'full path',
    { host: 'sshhost', 'sudo-password': 1111 },
    '/home/username',
    {
      identityFile: '/home/foo/.ssh/sshkey'
    },
    '/home/foo/.ssh/sshkey'
  ]
])('privateKeyPath (%s)', async (_title, argv, homePath, sshConfig, privateKeyPath) => {
  const getArgvMock = getArgv as jest.Mock
  getArgvMock.mockReturnValue(argv)

  const getHomePathMock = getHomePath as jest.Mock
  getHomePathMock.mockResolvedValue(homePath)

  const parseSshConfigMock = parseSshConfig as jest.Mock
  parseSshConfigMock.mockResolvedValue(sshConfig)

  const res = await cli.getArgs()

  expect(res.privateKeyPath).toStrictEqual(privateKeyPath)
})
