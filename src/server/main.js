
import { registerSocketIoServer } from "./ServerApp"
import { createServer } from "http"
import express from 'express'

// Express App
const app = express()
const httpServer = createServer(app)

app.use((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' })
  res.end('This is a backend server, please visit the frontend server.')
})

// Register the socket.io server
registerSocketIoServer(httpServer)

// Start backend server
const PORT = 2500
httpServer.listen(PORT, () => {
  console.log(`Backend Server listening on port http://localhost:${PORT}`)
})
