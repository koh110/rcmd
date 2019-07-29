jest.spyOn(process.stdout, 'write').mockImplementation()
jest.spyOn(process.stderr, 'write').mockImplementation()

import { Duplex, Writable } from 'stream'
import { Client, ExecOptions, ClientChannel } from 'ssh2'
import { remoteCmd } from './ssh'

const writeMock = jest.fn()

class StreamMock extends Duplex {
  _read() {}
  _write(chunk, encoding, callback) {
    writeMock()
    callback()
  }
  _writev() {}
  _final() {}
  stdin = new Writable()
  stdout = new Writable()
  stderr = new Writable()
}

const streamMock = (new StreamMock() as any) as ClientChannel

const clientMock = new Client()
;(clientMock as any).exec = function(
  command: string,
  options: ExecOptions,
  callback: (err: Error, channel: ClientChannel) => void
) {
  callback(null, streamMock)
  return true
}

beforeEach(() => {
  writeMock.mockClear()
})

test('ssh remoteCmd success', done => {
  const exitCode = 0

  remoteCmd(clientMock, 'ls -la', null).then(res => {
    expect(res.code).toStrictEqual(exitCode)
    expect(res.stdout).toStrictEqual('/home\n/var')
    expect(writeMock.mock.calls.length).toStrictEqual(0)
    done()
  })

  streamMock.emit('data', '/home\n')
  streamMock.emit('data', '/var')
  streamMock.emit('close', exitCode, undefined)
})

test('ssh remoteCmd sudo success', done => {
  const exitCode = 0

  remoteCmd(clientMock, 'sudo ls -la', null).then(res => {
    expect(res.code).toStrictEqual(exitCode)
    expect(writeMock.mock.calls.length).toStrictEqual(1)
    done()
  })

  streamMock.emit('data', 'password')
  streamMock.emit('close', exitCode, undefined)
})

test('ssh remoteCmd fail', done => {
  const exitCode = 1

  remoteCmd(clientMock, 'ls -la', null).catch(res => {
    expect(res.code).toStrictEqual(exitCode)
    expect(res.stdout).toStrictEqual('/home\n/var')
    expect(writeMock.mock.calls.length).toStrictEqual(0)
    done()
  })

  streamMock.emit('data', '/home\n')
  streamMock.emit('data', '/var')
  streamMock.emit('close', exitCode, undefined)
})
