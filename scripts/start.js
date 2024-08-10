const { spawn } = require('child_process')
const fs = require('fs')

process.env.SWCRC = 'true'
process.env.NODE_ENV = 'production'

async function run() {
  if (!fs.existsSync('dist')) {
    console.log('\x1b[31m%s\x1b[0m', 'Please run `npm run build` before starting the server.')
    return
  }
  const server = spawn('node', ['dist/server/main.js'], {
    stdio: 'inherit',
  })
  server.on('close', (code) => {
    console.log(`Server process exited with code ${code}`)
  })
}

run()
