export function registerAllHandler(io) {
  io.on('connection', (socket) => {
    // Log the connection to the console when a user connects
    console.log(`A user connected from ${socket.handshake.address}`)
    // Register a handler for the disconnection event
    socket.on('disconnect', () => {
      console.log('A user disconnected')
    })
    // Register all event handlers
    socket.on('action', (action) => {
      console.log('Received action:', action)
      socket.emit('action', action)
    })
  })
}
