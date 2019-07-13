# rmtcmd

simple execute commands local and remotely over SSH

```javascript
const { connect } = require('rmtcmd')

const deploy = async ({ local, remote }) => {
  await local('ls -la ~/', { cwd: __dirname })
  await remote('sudo ls -la /home')
}

connect({
  host: '192.168.11.1',
  username: 'username',
  privateKey: require('fs').readFileSync(process.env.KEY),
  sudo_password: 'xxxx',
  task: deploy
})
  .then(() => console.log('done'))
  .catch(console.error)
```
