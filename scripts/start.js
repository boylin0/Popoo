const express = require('express')
const { createProxyMiddleware } = require('http-proxy-middleware')
const { spawn } = require('child_process')
const fs = require('fs')

process.env.SWCRC = 'true'
process.env.NODE_ENV = 'production'

async function run() {
  if (!fs.existsSync('dist')) {
    console.log('\x1b[31m%s\x1b[0m', 'Please run `npm run build` before starting the server.')
    return
  }
  // Start Socket.IO backend server
  const server = spawn('node', ['dist/server/main.js'], {
    stdio: 'inherit',
  })
  server.on('close', (code) => {
    console.log(`Server process exited with code ${code}`)
  })
  // Start Socket.IO frontend server
  const app = express()
  app.use(express.static('dist/client'))
  app.use('/socket.io', createProxyMiddleware({
    target: 'http://localhost:2500/socket.io',
    ws: true,
    proxyTimeout: 3000,
  }))
  const PORT = process.env.PORT || 2600
  app.listen(PORT, () => {
    console.log(`Server listening on port http://localhost:${PORT}`)
  })
}

run()
