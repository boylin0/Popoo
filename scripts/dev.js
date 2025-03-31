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

const nodemon = require('nodemon')
const express = require('express')
const { createServer } = require('http')
const webpack = require('webpack')
const webpackDevMiddleware = require('webpack-dev-middleware')
const webpackHotMiddleware = require('webpack-hot-middleware')
const webpackConfig = require('../webpack.config')
const { createProxyMiddleware } = require('http-proxy-middleware')

// Serve backend code
process.env.SWCRC = 'true'

/** @type {import('nodemon').Nodemon} */
const node = nodemon({
  exec: 'node -r @swc-node/register',
  script: 'src/server/main.js',
  ext: 'js json',
  watch: ['src/server'],
  env: { NODE_ENV: 'development', ...process.env },
  verbose: true,
  quiet: false,
})
node.on('log', (log) => console.log(log.colour))

// Express App
const app = express()
const server = createServer(app)

// serve frontend static files
const compiler = webpack(webpackConfig)
app.use(webpackDevMiddleware(compiler))
app.use(webpackHotMiddleware(compiler))

// Proxy socket.io requests to the backend
app.use(`${process.env.REACT_APP_SOCKETIO_PATH}`, createProxyMiddleware({
  target: `http://localhost:2500${process.env.REACT_APP_SOCKETIO_PATH}`, 
  ws: true,
  proxyTimeout: 3000,
}))

// Start the development server
const PORT = process.env.PORT || 2600
server.listen(PORT, () => {
  console.log(`Frontend Server listening on port http://localhost:${PORT}`)
})

// listen for SIGINT and SIGTERM signals to gracefully shut down the server
process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down server...')
  node.emit('exit')
  server.close(() => {
    console.log('Server closed')
    process.exit(0)
  })
})
