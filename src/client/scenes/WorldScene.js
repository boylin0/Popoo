import * as PIXI from 'pixi.js'

import GameWorld, { Floor, Utils } from '@/shared/GameWorld'
import GamePacket, { PACKET_TYPE, WORLD_EVENT } from '@/shared/GamePacket'

class WorldScene extends PIXI.Container {

  constructor(app) {
    super()
    /** @type {import('@/app/App').GameApplication} */
    this._app = app
    this._myBunny = null
    this._camera = { x: 0, y: 0 }
    this._isInitWorld = false
    this._keyboard = null
    this.initScene()
  }

  async initScene() {

    const [
      backgroundTexture,
    ] = await Utils.loadAssets([
      import('@/assets/background.png'),
    ])

    backgroundTexture.baseTexture.setRealSize(50, 50)
    const background = new PIXI.TilingSprite(backgroundTexture, 10000, 10000)
    background.anchor.set(0.5)
    this.addChild(background)

    const socketio = this._app.socketio

    const gameWorld = new GameWorld()
    gameWorld.start(170)
    await gameWorld.initGraphics(this)

    socketio.on('packet', async (data) => {
      const packet = new GamePacket(data)
      const type = packet.readInt16()
      switch (type) {
      case PACKET_TYPE.SYNC_WORLD: {
        gameWorld.setSyncPacket(this, packet)
        break
      }
      case PACKET_TYPE.WORLD_EVENT: {
        const event = packet.readInt16()
        switch (event) {
        case WORLD_EVENT.PLAYER_MOVE_FORWARD: {
          const id = packet.readString()
          if (id === socketio.id) break
          gameWorld.getPlayer(id)?.moveForward(id)
          break
        }
        case WORLD_EVENT.PLAYER_MOVE_FORWARD_END: {
          const id = packet.readString()
          if (id === socketio.id) break
          gameWorld.getPlayer(id)?.moveForwardEnd(id)
          break
        }
        case WORLD_EVENT.PLAYER_MOVE_BACKWARD: {
          const id = packet.readString()
          if (id === socketio.id) break
          gameWorld.getPlayer(id)?.moveBackward(id)
          break
        }
        case WORLD_EVENT.PLAYER_MOVE_BACKWARD_END: {
          const id = packet.readString()
          if (id === socketio.id) break
          gameWorld.getPlayer(id)?.moveBackwardEnd(id)
          break
        }
        case WORLD_EVENT.PLAYER_JUMP: {
          const id = packet.readString()
          if (id === socketio.id) break
          gameWorld.getPlayer(id)?.jump(id)
          break
        }
        case WORLD_EVENT.PLAYER_ATTACK: {
          const id = packet.readString()
          if (id === socketio.id) break
          gameWorld.getPlayer(id)?.attack(id)
          break
        }
        }
        break
      }
      }
    })

    const entities = gameWorld.getEntities()
    for (const entity of entities) {
      if (entity instanceof Floor) {
        await entity.initGraphics(this)
        continue
      }
    }

    this.gameWorld = gameWorld

    /** @type {Keyboard} */
    this._keyboard = await (await import('pixi.js-keyboard')).default

    // init pixi.js
    this._camera = { x: this.x, y: this.y }
    this.scale.set(0.9)

    this._isInitWorld = true
  }

  /**
     * 
     * @param {import('pixi.js').Sprite} sprite
     */
  targetCameraToSprite(sprite, speed = 0.02) {
    if (!sprite) return
    this._camera.x = -sprite.position.x + this._app.renderer.width / 2
    this._camera.y = -sprite.position.y + this._app.renderer.height / 2
    // move gradually
    if (this._camera.x !== this.x || this._camera.y !== this.y) {
      const dx = this._camera.x - this.x
      const dy = this._camera.y - this.y
      const d = Math.sqrt(dx * dx + dy * dy)
      if (d < speed) {
        this.x = this._camera.x
        this.y = this._camera.y
      } else {
        this.x += dx * speed
        this.y += dy * speed
      }
    }
  }

  update(dt) {
    if (!this._isInitWorld) return
    
    this.gameWorld.renderGraphics()

    this.targetCameraToSprite(this.gameWorld.getPlayer(this._app.socketio.id)?.graphics)

    const world = this.gameWorld
    const socketIoId = this._app.socketio.id

    console.log(this._keyboard)

    if (this._keyboard.isKeyPressed('ArrowLeft')) {
      world.getPlayer(socketIoId).moveBackward()
      const socketio = this._app.socketio
      socketio.emit('packet', new GamePacket()
        .writeInt16(PACKET_TYPE.WORLD_EVENT)
        .writeInt16(WORLD_EVENT.PLAYER_MOVE_BACKWARD)
        .writeString(socketio.id)
        .getData()
      )
    } else if (this._keyboard.isKeyReleased('ArrowLeft')) {
      world.getPlayer(socketIoId).moveBackwardEnd()
      const socketio = this._app.socketio
      socketio.emit('packet', new GamePacket()
        .writeInt16(PACKET_TYPE.WORLD_EVENT)
        .writeInt16(WORLD_EVENT.PLAYER_MOVE_BACKWARD_END)
        .writeString(socketio.id)
        .getData()
      )
    }

    if (this._keyboard.isKeyPressed('ArrowRight')) {
      world.getPlayer(socketIoId).moveForward()
      const socketio = this._app.socketio
      socketio.emit('packet', new GamePacket()
        .writeInt16(PACKET_TYPE.WORLD_EVENT)
        .writeInt16(WORLD_EVENT.PLAYER_MOVE_FORWARD)
        .writeString(socketio.id)
        .getData()
      )
    } else if (this._keyboard.isKeyReleased('ArrowRight')) {
      world.getPlayer(socketIoId).moveForwardEnd()
      const socketio = this._app.socketio
      socketio.emit('packet', new GamePacket()
        .writeInt16(PACKET_TYPE.WORLD_EVENT)
        .writeInt16(WORLD_EVENT.PLAYER_MOVE_FORWARD_END)
        .writeString(socketio.id)
        .getData()
      )
    }

    if (this._keyboard.isKeyPressed('ArrowUp')) {
      world.getPlayer(socketIoId).jump()
      const socketio = this._app.socketio
      socketio.emit('packet', new GamePacket()
        .writeInt16(PACKET_TYPE.WORLD_EVENT)
        .writeInt16(WORLD_EVENT.PLAYER_JUMP)
        .writeString(socketio.id)
        .getData()
      )
    }

    if (this._keyboard.isKeyPressed('Space')) {
      world.getPlayer(socketIoId).attack()
      const socketio = this._app.socketio
      socketio.emit('packet', new GamePacket()
        .writeInt16(PACKET_TYPE.WORLD_EVENT)
        .writeInt16(WORLD_EVENT.PLAYER_ATTACK)
        .writeString(socketio.id)
        .getData()
      )
    }

    this._keyboard.update()
  }
}

export default WorldScene