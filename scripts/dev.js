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
const node = nodemon({
  exec: 'node -r @swc-node/register',
  script: 'src/server/main.js',
  ext: 'js json',
  watch: ['src/server', 'webpack.config.js'],
  env: { NODE_ENV: 'development' },
  verbose: true,
  quiet: false,
})
node.on('log', (log) => console.log(log.colour))

// Express App
const app = express()
const server = createServer(app)

// serve frontend static files
const compiler = webpack(webpackConfig)
app.use(webpackDevMiddleware(compiler, { writeToDisk: true }))
app.use(webpackHotMiddleware(compiler))
app.use(express.static('dist/client'))

// Proxy socket.io requests to the backend
app.use('/socket.io', createProxyMiddleware({
  target: 'http://localhost:2500/socket.io', 
  ws: true,
  proxyTimeout: 3000,
}))

// Start the development server
const PORT = process.env.PORT || 2058
server.listen(PORT, () => {
  console.log(`Server listening on port http://localhost:${PORT}`)
})
