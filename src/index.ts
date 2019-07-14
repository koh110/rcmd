import * as ssh from './ssh'
import { getArgs } from './cli'

export const cli = { getArgs }

export const connect = ssh.connect
export type TaskFunction = ssh.TaskFunction
