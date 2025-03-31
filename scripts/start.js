// Check .env file exists
const fs = require('fs')
const path = require('path')
const envPath = path.resolve(__dirname, '../.env')
if (!fs.existsSync(envPath)) {
  console.error(`[ERROR] .env file not found at ${envPath}, please create one from .env.example`)
  process.exit(1)
}

// Load environment variables
require('dotenv').config({ path: '.env' })

const express = require('express')
const { createProxyMiddleware } = require('http-proxy-middleware')
const { spawn } = require('child_process')

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
  process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down server...')
    server.kill()
    process.exit(0)
  })
  // Start Socket.IO frontend server
  const app = express()
  app.use(express.static('dist/client'))
  // Proxy socket.io requests to the backend
  app.use(`${process.env.REACT_APP_SOCKETIO_PATH}`, createProxyMiddleware({
    target: `http://localhost:2500${process.env.REACT_APP_SOCKETIO_PATH}`,
    ws: true,
    proxyTimeout: 3000,
  }))
  const PORT = process.env.PORT || 2600
  app.listen(PORT, () => {
    console.log(`Frontend Server listening on port http://localhost:${PORT}`)
  })


}

run()
