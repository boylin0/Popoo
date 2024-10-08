import moment from 'moment'

import GameWorld from '@/shared/GameWorld.js'
import GamePacket, { PACKET_TYPE, WORLD_EVENT } from '@/shared/GamePacket.js'

import { Server as SocketIOServer } from 'socket.io'

class ServerApp {

  constructor() {
    this.gameWorld = null
    this.clients = []
  }

  start(io) {

    // Create a new game world
    this.gameWorld = new GameWorld()
    this.gameWorld.start(60)

    // Create a new socket.io server
    this.io = io
    console.log('[%s] Server started', moment().format('YYYY-MM-DD HH:mm:ss'))

    // Test Code {START}
    setInterval(() => {
      console.log('[%s] Total players: %s', moment().format('YYYY-MM-DD HH:mm:ss'), this.gameWorld.getPlayers().length)
    }, 1000)
    // Test Code {END}

    //
    // Listen for new connections
    //
    const handleNewConnection = (socket) => {
      // Add the new client to the list
      console.log('[%s] Connected', moment().format('YYYY-MM-DD HH:mm:ss'), socket.id)
      this.addClient(socket)
      // Remove the client from the list when disconnected
      socket.on('disconnect', () => {
        console.log('[%s] Disconnected', moment().format('YYYY-MM-DD HH:mm:ss'), socket.id)
        this.removeClient(socket.id)
        this.gameWorld.removePlayer(socket.id)
      })
      // Listen for packets
      socket.on('packet', this.handlePacketEvent.bind(this, socket))
    }
    this.io.on('connection', handleNewConnection)
  }

  addClient(socket) {
    this.clients.push({
      sessionId: socket.id,
      socket: socket,
    })
  }

  removeClient(sessionId) {
    this.clients = this.clients.filter((c) => c.sessionId !== sessionId)
  }

  getClient(sessionId) {
    return this.clients.find((c) => c.sessionId === sessionId)
  }

  getClients() {
    return this.clients
  }

  handlePacketEvent(socket, data) {
    const gameWorld = this.gameWorld
    const packet = new GamePacket(data)
    const type = packet.readInt16()
    switch (type) {
    case PACKET_TYPE.JOIN_WORLD: {
      const nickname = packet.readString()
      const characterTypeId = packet.readInt16()
      gameWorld.addPlayer(socket.id, nickname.substring(0, 12), characterTypeId)
      setInterval(() => {
        socket.emit('packet', new GamePacket()
          .writeInt16(PACKET_TYPE.SYNC_WORLD)
          .writeRawData(gameWorld.getSyncPacket())
          .getData()
        )
        //gameWorld.addPlayer(Math.random().toString(36).substring(7), Math.random() * 1000, CHARACTERS_TYPE.GAVIN);
      }, 300)
      console.log(
        '[%s] Player "%s"(%s) joined the world with character type %d',
        moment().format('YYYY-MM-DD HH:mm:ss'),
        nickname,
        socket.id,
        characterTypeId
      )
      break
    }
    case PACKET_TYPE.WORLD_EVENT: {
      const event = packet.readInt16()
      switch (event) {
      case WORLD_EVENT.PLAYER_MOVE_FORWARD: {
        const id = packet.readString()
        const player = gameWorld.getPlayer(id)
        player.moveForward()
        this.broadcastPacket(
          new GamePacket()
            .writeInt16(PACKET_TYPE.WORLD_EVENT)
            .writeInt16(WORLD_EVENT.PLAYER_MOVE_FORWARD)
            .writeString(id)
            .getData()
        )
        console.log(
          '[%s] Player "%s"(%s) move forward',
          moment().format('YYYY-MM-DD HH:mm:ss'),
          player.nickname,
          id,
        )
        break
      }
      case WORLD_EVENT.PLAYER_MOVE_FORWARD_END: {
        const id = packet.readString()
        const player = gameWorld.getPlayer(id)
        player.moveForwardEnd()
        this.broadcastPacket(
          new GamePacket()
            .writeInt16(PACKET_TYPE.WORLD_EVENT)
            .writeInt16(WORLD_EVENT.PLAYER_MOVE_FORWARD_END)
            .writeString(id)
            .getData()
        )
        console.log(
          '[%s] Player "%s"(%s) move forward end',
          moment().format('YYYY-MM-DD HH:mm:ss'),
          player.nickname,
          id,
        )
        break
      }
      case WORLD_EVENT.PLAYER_MOVE_BACKWARD: {
        const id = packet.readString()
        const player = gameWorld.getPlayer(id)
        player.moveBackward()
        this.broadcastPacket(
          new GamePacket()
            .writeInt16(PACKET_TYPE.WORLD_EVENT)
            .writeInt16(WORLD_EVENT.PLAYER_MOVE_BACKWARD)
            .writeString(id)
            .getData()
        )
        console.log(
          '[%s] Player "%s"(%s) move backward',
          moment().format('YYYY-MM-DD HH:mm:ss'),
          player.nickname,
          id,
        )
        break
      }
      case WORLD_EVENT.PLAYER_MOVE_BACKWARD_END: {
        const id = packet.readString()
        const player = gameWorld.getPlayer(id)
        player.moveBackwardEnd()
        this.broadcastPacket(
          new GamePacket()
            .writeInt16(PACKET_TYPE.WORLD_EVENT)
            .writeInt16(WORLD_EVENT.PLAYER_MOVE_BACKWARD_END)
            .writeString(id)
            .getData()
        )
        console.log(
          '[%s] Player "%s"(%s) move backward end',
          moment().format('YYYY-MM-DD HH:mm:ss'),
          player.nickname,
          id,
        )
        break
      }
      case WORLD_EVENT.PLAYER_JUMP: {
        const id = packet.readString()
        const player = gameWorld.getPlayer(id)
        player.jump()
        this.broadcastPacket(
          new GamePacket()
            .writeInt16(PACKET_TYPE.WORLD_EVENT)
            .writeInt16(WORLD_EVENT.PLAYER_JUMP)
            .writeString(id)
            .getData()
        )
        console.log(
          '[%s] Player "%s"(%s) jump',
          moment().format('YYYY-MM-DD HH:mm:ss'),
          player.nickname,
          id,
        )
        break
      }
      case WORLD_EVENT.PLAYER_ATTACK: {
        const id = packet.readString()
        const player = gameWorld.getPlayer(id)
        player.attack()
        this.broadcastPacket(
          new GamePacket()
            .writeInt16(PACKET_TYPE.WORLD_EVENT)
            .writeInt16(WORLD_EVENT.PLAYER_ATTACK)
            .writeString(id)
            .getData()
        )
        console.log(
          '[%s] Player "%s"(%s) attack',
          moment().format('YYYY-MM-DD HH:mm:ss'),
          player.nickname,
          id,
        )
        break
      }
      }
      break
    }
    }
  }

  broadcastPacket(packet) {
    this.getClients().forEach((client) => {
      client.socket.emit('packet', packet)
    })
  }
}



/**
 * Register the socket.io server
 * @param {import('http').Server} httpServer
 */
export async function registerSocketIoServer(httpServer) {
  // socket server
  const io = new SocketIOServer(httpServer, {
    path: process.env.REACT_APP_SOCKETIO_PATH,
  })
  const serverApp = new ServerApp()
  serverApp.start(io)
}
