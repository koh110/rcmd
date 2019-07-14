import util from 'util'
import { exec as _exec, ExecOptions } from 'child_process'

const execAsync = util.promisify(_exec)

export async function exec(cmd: string, options?: ExecOptions) {
  const { stdout } = await execAsync(cmd, { timeout: 10000, encoding: 'utf8', ...options })
  return stdout
}
