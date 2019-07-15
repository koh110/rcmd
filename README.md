# rmtcmd

[![CircleCI](https://circleci.com/gh/koh110/rmtcmd.svg?style=svg)](https://circleci.com/gh/koh110/rmtcmd)

simple execute commands local and remotely over SSH

```bash
./example.js -u userName -h 192.168.11.1

✔ [sudo] Password: … ****
```

```javascript
#!/usr/bin/env node

const rmtcmd = require('rmtcmd')

// execute commands
const deploy = async ({ config, local, remote }) => {
  await local('ls -la ./dist', { cwd: __dirname })

  const target = `/home/${config.username}/rmtcmd`

  await remote(`sudo mkdir -p ${target}`)
  await remote(`sudo chmod 775 ${target}`)
  await remote(`sudo chown ${config.username}:${config.username} ${target}`)

  const src = path.join(__dirname, 'dist', 'src')

  await local(
    [
      `rsync -av`,
      `--exclude='node_modules'`,
      `-e 'ssh -i ${config.privateKeyPath}'`,
      `${src}/`,
      `${config.username}@${config.host}:${target}`
    ].join(' '),
    {
      cwd: __dirname
    }
  )

  await remote(`ls -la ${target}`)
}

;(async () => {
  const { host, username, privateKeyPath, sudoPassword } = await rmtcmd.cli.getArgs()

  const privateKey = require('fs').readFileSync(privateKeyPath)

  await rmtcmd.connect({
    host,
    username,
    privateKey,
    sudoPassword,
    task: deploy
  })
})().catch(console.error)
```

# API

## connect(config)

wrapper `ssh2.client.connect`

- config
  - ...[ssh2.Client.connect](https://github.com/mscdex/ssh2#client-methods)
  - sudoPassword \<string\>
  - privateKeyPath: \<string\> ssh private key path (optional)
  - task \<[TaskFunction](#TaskFunction)\>

### TaskFunction

async function

- args

  - config \<[opject](#connectconfig)> connect config
  - local \<[LocalCmd](#LocalCmd)\> executer async function for local command
  - remote \<[RemoteCmd](#RemoteCmd)\> executer async function for remote command

- returns Promise\<void\>

### LocalCmd

wrapper `child_process.exec`

- args

  - cmd \<string\> command
  - options
    - ...[`child_process.exec.options`](https://nodejs.org/dist/latest-v12.x/docs/api/child_process.html#child_process_child_process_exec_command_options_callback)
    - encoding
      - default: 'utf8'
    - timeout
      - default: 10000

- returns Promise\<{ stdout, stderr }\>

### RemoteCmd

- args

  - cmd \<string\> command
  - password \<string\> sudo password (optional)

- returns Promise\<{ code: number, signal: boolean, stdout: string }\>

## cli

### getArgs()

- returns
  - host \<string\> remote host.
    - option: `-h` or `--host`
  - port \<number\> ssh port
    - option: `--port` (optional)
    - default: 22
  - username \<string\> ssh user name.
    - option: `-u` or `--username` (optional)
    - default: `whoami`
  - sudoPassword \<string\> ssh sudo password.
    - option: `--sudo-password` (optional)
    - default: prompt
  - privateKeyPath \<string\> private key path.
    - option: `-k` or `--private-key-path`. (optional)
    - default: ~/.ssh/id_rsa
