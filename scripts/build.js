const webpack = require('webpack')
const { spawn } = require('child_process')

process.env.SWCRC = 'true'
process.env.NODE_ENV = 'production'

async function compile() {

  // Compile the server-side code
  console.log('\x1b[33m%s\x1b[0m', 'Compiling server-side code...')
  await new Promise((resolve) => {
    const swcProc = spawn('swc src/server -d dist --strip-leading-paths', {
      stdio: 'inherit',
      shell: true,
    })
    swcProc.on('close', (code) => {
      console.log(`SWC process exited with code ${code}`)
      resolve()
    })
  })
  console.log('Server-side code compiled completed!\n')

  // Compile the client-side code
  console.log('\x1b[33m%s\x1b[0m', 'Compiling client-side code...')
  const webpackConfig = require('../webpack.config')
  const compiler = webpack(webpackConfig)
  await new Promise((resolve) => {
    compiler.run((err, stats) => {
      if (err) {
        console.error(err)
        resolve()
        return
      }
      process.stdout.write('\r')
      console.log(
        stats.toString({
          chunks: false,
          colors: true,
        }),
      )
      resolve()
    })
  })
  console.log('Client-side code compiled completed!')
  console.log('\x1b[32m%s\x1b[0m', 'Build completed!')
}

compile()

