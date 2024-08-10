
import { registerSocketIoServer } from "./ServerApp"
import { createServer } from "http"
import express from 'express'

// Express App
const app = express()
const httpServer = createServer(app)

// Register the socket.io server
registerSocketIoServer(httpServer)

// Start backend server
const PORT = 2500
httpServer.listen(PORT, () => {
  console.log(`Server listening on port http://localhost:${PORT}`)
})
