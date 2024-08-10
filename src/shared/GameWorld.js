import Matter from 'matter-js'
import * as PIXI from 'pixi.js'
import GamePacket, { CHARACTERS_TYPE, PACKET_TYPE } from './GamePacket.js'

const TIMESTEP = 1000 / 60

export const Utils = {
  /**
     * @returns {Promise<PIXI.Texture[]>}
     * */
  loadAssets: async (imports) => {
    const assets = await Promise.all(imports)
    const textures = []
    for (const asset of assets) {
      textures.push(await PIXI.Assets.load(asset.default))
    }
    return textures
  }
}

export class GameEntity {
  constructor(gameWorld) {
    /** @type {GameWorld} */
    this._gameWorld = gameWorld
    this.graphics = null
    this.body = null
    this.scene = null
    this.id = Math.random().toString(36)
  }

  async initGraphics(scene) {
    //throw new Error('Not implemented');
  }

  disposeGraphics(scene) {
    //throw new Error('Not implemented');
  }

  renderGraphics() {
    //throw new Error('Not implemented');
  }

  _initPhysics() {
    //throw new Error('Not implemented');
  }

  disposePhysics() {
    //throw new Error('Not implemented');
  }

  renderPhysics() {
    //throw new Error('Not implemented');
  }

  setScene(scene) {
    this.scene = scene
  }
}

export class WorldItem extends GameEntity {
  constructor(gameWorld, id, x, y) {
    super(gameWorld)
    this.id = id
    this.x = x
    this.y = y
    this._initPhysics()
  }

  async initGraphics(scene) {
    this.graphics = new PIXI.Container()

    const [
      worldItemTexture,
    ] = await Utils.loadAssets([
      import('@/assets/world_item.png'),
    ])
    const sprite = new PIXI.Sprite(worldItemTexture)
    sprite.anchor.set(0.5)
    sprite.width = 50
    sprite.height = 50
    this.graphics.addChild(sprite)
    scene.addChild(this.graphics)
    this.setScene(scene)
    return this.graphics
  }

  renderGraphics() {
    this.graphics.position.set(this.body.position.x, this.body.position.y)
  }

  _initPhysics() {
    const body = Matter.Bodies.rectangle(this.x, this.y, 50, 50)
    // bounce
    body.restitution = 0.5
    // friction
    body.friction = 0.5
    // density
    body.density = 0.01
    this.body = body
    Matter.World.add(this._gameWorld.world, body)
    return body
  }

  renderPhysics() {
    return
  }


  disposeGraphics() {
    this.scene.removeChild(this.graphics)
  }

  disposePhysics() {
    Matter.World.remove(this._gameWorld.world, this.body)
  }
}

export class Floor extends GameEntity {
  constructor(gameWorld, x, y, width, height) {
    super(gameWorld)
    this.x = x
    this.y = y
    this.width = width
    this.height = height
    this._initPhysics()
  }

  async initGraphics(scene) {
    const container = new PIXI.Container()

    const [
      floorTexture,
    ] = await Utils.loadAssets([
      import('@/assets/floor.jpg'),
    ])
    const sprite = new PIXI.TilingSprite(floorTexture, this.width, this.height)
    sprite.name = 'floorSprite'
    sprite.anchor.set(0.5)
    sprite.width = this.body.bounds.max.x - this.body.bounds.min.x
    sprite.height = this.body.bounds.max.y - this.body.bounds.min.y
    sprite.x = this.body.position.x
    sprite.y = this.body.position.y
    container.addChild(sprite)

    this.graphics = container
    scene.addChild(this.graphics)
    this.setScene(scene)
    return this.graphics
  }

  renderGraphics() {
    const floorSprite = this.graphics.getChildByName('floorSprite')
    floorSprite.position.set(this.body.position.x, this.body.position.y)
    floorSprite.rotation = this.body.angle
  }

  _initPhysics() {
    const body = Matter.Bodies.rectangle(this.x, this.y, this.width, this.height, { isStatic: true })
    this.body = body
    Matter.World.add(this._gameWorld.world, body)
    return body
  }

  renderPhysics() {
    return
  }

  disposeGraphics(scene) {
    this.scene.removeChild(this.graphics)
  }

  disposePhysics() {
    Matter.World.remove(this._gameWorld.world, this.body)
  }
}


export class Character extends GameEntity {
  constructor(gameWorld, id, nickname, characterType, x, y) {
    super(gameWorld)
    this.characterType = characterType

    this.id = id
    this.nickname = nickname

    this.x = x
    this.y = y

    this._health = 100
    this._isGrounded = false
    this._lastAttacker = null
    this._killCount = 0
    this._lastAttackTimestamp = 0
    this._lastJumpTimestamp = 0

    this._input = {
      forward: false,
      backward: false,
    }
    this._initPhysics()
  }

  async initGraphics(scene) {
    const container = new PIXI.Container()

    // Character Sprite
    const characterTextureArray = await Utils.loadAssets([
      import('@/assets/gavin/gavin_idle00.png'),
      import('@/assets/gavin/gavin_idle01.png'),
      import('@/assets/gavin/gavin_idle02.png'),
      import('@/assets/gavin/gavin_idle03.png'),
      import('@/assets/gavin/gavin_idle04.png'),
      import('@/assets/gavin/gavin_idle05.png'),
      import('@/assets/gavin/gavin_idle06.png'),
      import('@/assets/gavin/gavin_idle07.png'),
      import('@/assets/gavin/gavin_idle08.png'),
      import('@/assets/gavin/gavin_idle09.png'),
      import('@/assets/gavin/gavin_idle10.png'),
      import('@/assets/gavin/gavin_idle11.png'),
      import('@/assets/gavin/gavin_idle12.png'),
      import('@/assets/gavin/gavin_idle13.png'),
      import('@/assets/gavin/gavin_idle14.png'),
      import('@/assets/gavin/gavin_idle15.png'),
      import('@/assets/gavin/gavin_idle16.png'),
      import('@/assets/gavin/gavin_idle17.png'),
      import('@/assets/gavin/gavin_idle18.png'),
      import('@/assets/gavin/gavin_idle19.png'),
      import('@/assets/gavin/gavin_idle20.png'),
    ])
    const characterSprite = new PIXI.AnimatedSprite(characterTextureArray)
    characterSprite.name = 'characterSprite'
    characterSprite.anchor.set(0.5, 0.8)
    characterSprite.animationSpeed = 0.1
    characterSprite.play()
    characterSprite.width = 125
    characterSprite.height = 125
    container.addChild(characterSprite)

    // Health bar
    const healthBar = new PIXI.Graphics()
    healthBar.name = 'healthBar'
    healthBar.beginFill(0xff0000)
    healthBar.drawRect(0, 0, 100, 10)
    healthBar.endFill()
    healthBar.beginFill(0x00ff00)
    healthBar.drawRect(0, 0, this._health, 10)
    healthBar.endFill()
    healthBar.position.set(-50, -80)
    container.addChild(healthBar)

    // Nickname
    const nicknameText = new PIXI.Text(this.nickname, {
      fill: 0xffffff,
      align: 'center',
    })
    nicknameText.name = 'nicknameText'
    nicknameText.anchor.set(0.5)
    nicknameText.position.set(0, -100)
    container.addChild(nicknameText)

    // strike effect
    const strikeEffectTexture = await Utils.loadAssets([
      import('@/assets/attack/attack1_00.png'),
      import('@/assets/attack/attack1_01.png'),
      import('@/assets/attack/attack1_02.png'),
      import('@/assets/attack/attack1_03.png'),
      import('@/assets/attack/attack1_04.png'),
      import('@/assets/attack/attack1_05.png'),
      import('@/assets/attack/attack1_06.png'),
      import('@/assets/attack/attack1_07.png'),
      import('@/assets/attack/attack1_08.png'),
      import('@/assets/attack/attack1_09.png'),
      import('@/assets/attack/attack1_10.png'),
      import('@/assets/attack/attack1_11.png'),
      import('@/assets/attack/attack1_12.png'),
      import('@/assets/attack/attack1_13.png'),
      import('@/assets/attack/attack1_14.png'),
      import('@/assets/attack/attack1_15.png'),
      import('@/assets/attack/attack1_16.png'),
    ])
    const strikeEffect = new PIXI.AnimatedSprite(strikeEffectTexture)
    strikeEffect.name = 'strikeEffect'
    strikeEffect.anchor.set(0.5, 0.6)
    strikeEffect.width = 200
    strikeEffect.height = 200
    strikeEffect.scale.set(1.5)
    strikeEffect.visible = false
    strikeEffect.animationSpeed = 0.9
    strikeEffect.loop = false
    strikeEffect.onComplete = () => {
      strikeEffect.visible = false
    }
    container.addChild(strikeEffect)

    // kill count
    const killCountText = new PIXI.Text('Kill: 0', {
      fill: 0xffffff,
      align: 'center',
      fontSize: 14,
    })
    killCountText.name = 'killCountText'
    killCountText.anchor.set(0.5)
    killCountText.position.set(0, -120)
    container.addChild(killCountText)

    this.graphics = container
    scene.addChild(container)
    this.setScene(scene)
    return container
  }

  _initPhysics() {
    const body = Matter.Bodies.rectangle(this.x, this.y, 50, 50, { inertia: Infinity })
    Matter.World.add(this._gameWorld.world, body)
    Matter.Events.on(this._gameWorld._engine, 'collisionStart', (event) => {
      for (const pair of event.pairs) {
        if (pair.bodyA === this.body || pair.bodyB === this.body) {
          this._isGrounded = true
        }
      }
    })
    Matter.Events.on(this._gameWorld._engine, 'collisionEnd', (event) => {
      for (const pair of event.pairs) {
        if (pair.bodyA === this.body || pair.bodyB === this.body) {
          this._isGrounded = false
        }
      }
    })
    Matter.Events.on(this._gameWorld._engine, 'collisionActive', (event) => {
      for (const pair of event.pairs) {
        if (pair.bodyA === this.body || pair.bodyB === this.body) {
          this._isGrounded = true
        }
      }
    })
    this.body = body
  }

  renderPhysics() {
    return
  }

  renderGraphics() {
    const characterSprite = this.graphics.getChildByName('characterSprite')
    if (this._input.backward && characterSprite.scale.x > 0) {
      characterSprite.scale.x = -characterSprite.scale.x
    }
    if (this._input.forward && characterSprite.scale.x < 0) {
      characterSprite.scale.x = -characterSprite.scale.x
    }
    characterSprite.rotation = this.body.angle
    this.graphics.position.set(this.body.position.x, this.body.position.y)
  }

  disposeGraphics() {
    this.scene.removeChild(this.graphics)
  }

  disposePhysics() {
    Matter.World.remove(this._gameWorld.world, this.body)
  }

  get health() {
    return this._health
  }

  set health(value) {
    this._health = value
    if (this._health < 0) {
      this._health = 0
    }
    if (this.graphics === null) return
    const healthBar = this.graphics.getChildByName('healthBar')
    healthBar.clear()
    healthBar.beginFill(0xff0000)
    healthBar.drawRect(0, 0, 100, 10)
    healthBar.endFill()
    healthBar.beginFill(0x00ff00)
    healthBar.drawRect(0, 0, this._health, 10)
    healthBar.endFill()
  }

  get killCount() {
    return this._killCount
  }

  set killCount(value) {
    this._killCount = value
    if (this.graphics === null) return
    const killCountText = this.graphics.getChildByName('killCountText')
    killCountText.text = `Kill: ${this._killCount}`
  }

  newKill() {
    this._killCount++
    if (this.graphics === null) return
    const killCountText = this.graphics.getChildByName('killCountText')
    killCountText.text = `Kill: ${this._killCount}`
  }

  moveForward() {
    //Matter.Body.setVelocity(this.body, { x: 10, y: this.body.velocity.y });
    this._input.forward = true
  }

  moveForwardEnd() {
    this._input.forward = false
  }

  moveBackward() {
    this._input.backward = true
    //Matter.Body.setVelocity(this.body, { x: -10, y: this.body.velocity.y });
  }

  moveBackwardEnd() {
    this._input.backward = false
  }

  jump() {
    if (Date.now() - this._lastJumpTimestamp < 100) return
    if (this._isGrounded) {
      Matter.Body.applyForce(this.body, this.body.position, { x: 0, y: -0.08 })
      this._lastJumpTimestamp = Date.now()
    }
  }

  attack() {
    if (Date.now() - this._lastAttackTimestamp < 200) return
    const gameWorld = this._gameWorld
    const player = this
    for (const otherPlayer of gameWorld.getEntities(Character)) {
      if (otherPlayer === player) continue
      const dx = otherPlayer.body.position.x - player.body.position.x
      const dy = otherPlayer.body.position.y - player.body.position.y
      const distance = Math.sqrt(dx * dx + dy * dy)
      if (distance > 200) continue
      const angle = Math.atan2(dy, dx)
      const force = 0.3
      const fx = force * Math.cos(angle)
      const fy = force * Math.sin(angle)
      Matter.Body.applyForce(otherPlayer.body, otherPlayer.body.position, { x: fx, y: fy })
      otherPlayer.health -= 10
      otherPlayer._lastAttacker = player
    }
    Matter.Body.applyForce(player.body, player.body.position, { x: 0.0, y: -0.05 })
    this._lastAttackTimestamp = Date.now()
    if (this.graphics === null) return
    const strikeEffect = this.graphics.getChildByName('strikeEffect')
    strikeEffect.visible = true
    strikeEffect.gotoAndPlay(0)

  }
}

export class GavinCharacter extends Character {
  constructor(gameWorld, id, nickname, x, y) {
    super(gameWorld, id, nickname, CHARACTERS_TYPE.GAVIN, x, y)
  }

  async initGraphics(scene) {

    const container = new PIXI.Container()

    // Character Sprite
    const characterTextureArray = await Utils.loadAssets([
      import('@/assets/gavin/gavin_idle00.png'),
      import('@/assets/gavin/gavin_idle01.png'),
      import('@/assets/gavin/gavin_idle02.png'),
      import('@/assets/gavin/gavin_idle03.png'),
      import('@/assets/gavin/gavin_idle04.png'),
      import('@/assets/gavin/gavin_idle05.png'),
      import('@/assets/gavin/gavin_idle06.png'),
      import('@/assets/gavin/gavin_idle07.png'),
      import('@/assets/gavin/gavin_idle08.png'),
      import('@/assets/gavin/gavin_idle09.png'),
      import('@/assets/gavin/gavin_idle10.png'),
      import('@/assets/gavin/gavin_idle11.png'),
      import('@/assets/gavin/gavin_idle12.png'),
      import('@/assets/gavin/gavin_idle13.png'),
      import('@/assets/gavin/gavin_idle14.png'),
      import('@/assets/gavin/gavin_idle15.png'),
      import('@/assets/gavin/gavin_idle16.png'),
      import('@/assets/gavin/gavin_idle17.png'),
      import('@/assets/gavin/gavin_idle18.png'),
      import('@/assets/gavin/gavin_idle19.png'),
      import('@/assets/gavin/gavin_idle20.png'),
    ])
    const characterSprite = new PIXI.AnimatedSprite(characterTextureArray)
    characterSprite.name = 'characterSprite'
    characterSprite.anchor.set(0.5, 0.8)
    characterSprite.animationSpeed = 0.1
    characterSprite.play()
    characterSprite.width = 125
    characterSprite.height = 125
    container.addChild(characterSprite)

    // Health bar
    const healthBar = new PIXI.Graphics()
    healthBar.name = 'healthBar'
    healthBar.beginFill(0xff0000)
    healthBar.drawRect(0, 0, 100, 10)
    healthBar.endFill()
    healthBar.beginFill(0x00ff00)
    healthBar.drawRect(0, 0, this._health, 10)
    healthBar.endFill()
    healthBar.position.set(-50, -80)
    container.addChild(healthBar)

    // Nickname
    const nicknameText = new PIXI.Text(this.nickname, {
      fill: 0xffffff,
      align: 'center',
    })
    nicknameText.name = 'nicknameText'
    nicknameText.anchor.set(0.5)
    nicknameText.position.set(0, -100)
    container.addChild(nicknameText)

    // strike effect
    const strikeEffectTexture = await Utils.loadAssets([
      import('@/assets/attack/attack1_00.png'),
      import('@/assets/attack/attack1_01.png'),
      import('@/assets/attack/attack1_02.png'),
      import('@/assets/attack/attack1_03.png'),
      import('@/assets/attack/attack1_04.png'),
      import('@/assets/attack/attack1_05.png'),
      import('@/assets/attack/attack1_06.png'),
      import('@/assets/attack/attack1_07.png'),
      import('@/assets/attack/attack1_08.png'),
      import('@/assets/attack/attack1_09.png'),
      import('@/assets/attack/attack1_10.png'),
      import('@/assets/attack/attack1_11.png'),
      import('@/assets/attack/attack1_12.png'),
      import('@/assets/attack/attack1_13.png'),
      import('@/assets/attack/attack1_14.png'),
      import('@/assets/attack/attack1_15.png'),
      import('@/assets/attack/attack1_16.png'),
    ])
    const strikeEffect = new PIXI.AnimatedSprite(strikeEffectTexture)
    strikeEffect.name = 'strikeEffect'
    strikeEffect.anchor.set(0.5, 0.6)
    strikeEffect.width = 200
    strikeEffect.height = 200
    strikeEffect.scale.set(1.5)
    strikeEffect.visible = false
    strikeEffect.animationSpeed = 0.9
    strikeEffect.loop = false
    strikeEffect.onComplete = () => {
      strikeEffect.visible = false
    }
    container.addChild(strikeEffect)

    // kill count
    const killCountText = new PIXI.Text('Kill: 0', {
      fill: 0xffffff,
      align: 'center',
      fontSize: 14,
    })
    killCountText.name = 'killCountText'
    killCountText.anchor.set(0.5)
    killCountText.position.set(0, -120)
    container.addChild(killCountText)

    this.graphics = container
    scene.addChild(container)
    this.setScene(scene)
    return container
  }
}

export class NightShadeCharacter extends Character {
  constructor(gameWorld, id, nickname, x, y) {
    super(gameWorld, id, nickname, CHARACTERS_TYPE.NIGHTSHADE, x, y)
  }

  async initGraphics(scene) {

    const container = new PIXI.Container()

    // Character Sprite
    const characterTextureArray = await Utils.loadAssets([
      import('@/assets/nightshade/nightshade_idle00.png'),
      import('@/assets/nightshade/nightshade_idle01.png'),
      import('@/assets/nightshade/nightshade_idle02.png'),
      import('@/assets/nightshade/nightshade_idle03.png'),
      import('@/assets/nightshade/nightshade_idle04.png'),
      import('@/assets/nightshade/nightshade_idle05.png'),
      import('@/assets/nightshade/nightshade_idle06.png'),
      import('@/assets/nightshade/nightshade_idle07.png'),
      import('@/assets/nightshade/nightshade_idle08.png'),
      import('@/assets/nightshade/nightshade_idle09.png'),
      import('@/assets/nightshade/nightshade_idle10.png'),
      import('@/assets/nightshade/nightshade_idle11.png'),
      import('@/assets/nightshade/nightshade_idle12.png'),
      import('@/assets/nightshade/nightshade_idle13.png'),
      import('@/assets/nightshade/nightshade_idle14.png'),
      import('@/assets/nightshade/nightshade_idle15.png'),
      import('@/assets/nightshade/nightshade_idle16.png'),
      import('@/assets/nightshade/nightshade_idle17.png'),
      import('@/assets/nightshade/nightshade_idle18.png'),
      import('@/assets/nightshade/nightshade_idle19.png'),
      import('@/assets/nightshade/nightshade_idle20.png'),
    ])
    const characterSprite = new PIXI.AnimatedSprite(characterTextureArray)
    characterSprite.name = 'characterSprite'
    characterSprite.anchor.set(0.5, 0.8)
    characterSprite.animationSpeed = 0.1
    characterSprite.play()
    characterSprite.width = 125
    characterSprite.height = 125
    container.addChild(characterSprite)

    // Health bar
    const healthBar = new PIXI.Graphics()
    healthBar.name = 'healthBar'
    healthBar.beginFill(0xff0000)
    healthBar.drawRect(0, 0, 100, 10)
    healthBar.endFill()
    healthBar.beginFill(0x00ff00)
    healthBar.drawRect(0, 0, this._health, 10)
    healthBar.endFill()
    healthBar.position.set(-50, -80)
    container.addChild(healthBar)

    // Nickname
    const nicknameText = new PIXI.Text(this.nickname, {
      fill: 0xffffff,
      align: 'center',
    })
    nicknameText.name = 'nicknameText'
    nicknameText.anchor.set(0.5)
    nicknameText.position.set(0, -100)
    container.addChild(nicknameText)

    // strike effect
    const strikeEffectTexture = await Utils.loadAssets([
      import('@/assets/attack/attack1_00.png'),
      import('@/assets/attack/attack1_01.png'),
      import('@/assets/attack/attack1_02.png'),
      import('@/assets/attack/attack1_03.png'),
      import('@/assets/attack/attack1_04.png'),
      import('@/assets/attack/attack1_05.png'),
      import('@/assets/attack/attack1_06.png'),
      import('@/assets/attack/attack1_07.png'),
      import('@/assets/attack/attack1_08.png'),
      import('@/assets/attack/attack1_09.png'),
      import('@/assets/attack/attack1_10.png'),
      import('@/assets/attack/attack1_11.png'),
      import('@/assets/attack/attack1_12.png'),
      import('@/assets/attack/attack1_13.png'),
      import('@/assets/attack/attack1_14.png'),
      import('@/assets/attack/attack1_15.png'),
      import('@/assets/attack/attack1_16.png'),
    ])
    const strikeEffect = new PIXI.AnimatedSprite(strikeEffectTexture)
    strikeEffect.name = 'strikeEffect'
    strikeEffect.anchor.set(0.5, 0.6)
    strikeEffect.width = 200
    strikeEffect.height = 200
    strikeEffect.scale.set(1.5)
    strikeEffect.visible = false
    strikeEffect.animationSpeed = 0.9
    strikeEffect.loop = false
    strikeEffect.onComplete = () => {
      strikeEffect.visible = false
    }
    container.addChild(strikeEffect)

    // kill count
    const killCountText = new PIXI.Text('Kill: 0', {
      fill: 0xffffff,
      align: 'center',
      fontSize: 14,
    })
    killCountText.name = 'killCountText'
    killCountText.anchor.set(0.5)
    killCountText.position.set(0, -120)
    container.addChild(killCountText)

    this.graphics = container
    scene.addChild(container)
    this.setScene(scene)
    return container
  }
}


export default class GameWorld {

  constructor() {
    this._engine = Matter.Engine.create()
    this._entities = []
    this._tickInterval = null
    this._tickRate = 60
    this.nextTimestep = null
    this._isInitGraphics = false
  }

  get engine() {
    return this._engine
  }

  get world() {
    return this._engine.world
  }

  /**
     * 
     * @returns {Character[]}
     */
  getPlayers() {
    return this.getEntities(Character)
  }

  /** @returns {Character} */
  getPlayer(id) {
    return this.getEntities(Character).find(player => player.id === id)
  }

  getEntity(id) {
    return this._entities.find(entity => entity.id === id)
  }

  /**
     * 
     * @param {T} entityType
     * @returns {T[]}
     * */
  getEntities(entityType = null) {
    if (!entityType) return this._entities
    return this._entities.filter(object => object instanceof entityType) || []
  }

  start(tickRate = 20) {

    // build terrain
    this.addEntity(new Floor(this, 0, 600, 5000, 300))
    for (let i = 0; i < 10; i++) {
      this.addEntity(new Floor(this, -800 + i * 250, 250, 50, 50))
    }

    // Add world item
    for (let i = 0; i < 10; i++) {
      this.addEntity(new WorldItem(this, 'item' + i, -500 + i * 100, 500))
    }

    this.setTickRateAndStartTick(tickRate)
  }

  setTickRateAndStartTick(tickRate) {
    this._tickRate = tickRate
    if (this._tickInterval) {
      clearInterval(this._tickInterval)
    }
    this._tickInterval = setInterval(this.updatePhiysics.bind(this), 1000 / this._tickRate)
  }

  updatePhiysics() {
    this.nextTimestep = this.nextTimestep || Date.now()
    while (Date.now() > this.nextTimestep) {
      // check any player is out of the world
      const players = this.getPlayers()
      for (const player of players) {

        if (player._input.forward && !player._input.backward) {
          Matter.Body.setVelocity(player.body, { x: 10, y: player.body.velocity.y })
        }
        if (player._input.backward && !player._input.forward) {
          Matter.Body.setVelocity(player.body, { x: -10, y: player.body.velocity.y })
        }

        if (player.body.position.y > 1000 || player.body.position.y < -3000 || player.health <= 0) {
          Matter.Body.setPosition(player.body, { x: 100, y: 100 })
          Matter.Body.setVelocity(player.body, { x: 0, y: 0 })
          Matter.Body.setAngle(player.body, 0)
          Matter.Body.setAngularVelocity(player.body, 0)
          Matter.Body.setAngularSpeed(player.body, 0)
          player.killCount = 0
          player.health = 100
          if (player._lastAttacker) {
            player._lastAttacker.health = 100
            player._lastAttacker.newKill()
            console.log('[%s] Player "%s"(%s) killed player "%s"(%s)',
              new Date().toISOString(),
              player._lastAttacker.nickname,
              player._lastAttacker.id,
              player.nickname,
              player.id
            )
          }
        }
      }
      Matter.Engine.update(this.engine, TIMESTEP)
      this.nextTimestep += TIMESTEP
    }
  }

  async initGraphics(scene) {
    for (const entity of this._entities) {
      await entity.initGraphics(scene)
    }
    this._isInitGraphics = true
  }

  renderGraphics() {
    if (this._isInitGraphics === false) return
    for (const entity of this._entities) {
      try {
        entity.renderGraphics()
      } catch (e) {
        //console.error(e);
      }
    }
  }

  addEntity(entity) {
    this._entities.push(entity)
    return entity
  }

  removeEntity(entity) {
    entity.disposeGraphics()
    this._entities = this._entities.filter(object => object !== entity)
  }

  addPlayer(id, nickname, characterType) {
    let character = null
    if (characterType === CHARACTERS_TYPE.GAVIN) {
      character = new GavinCharacter(this, id, nickname, characterType, 100, 100)
    }
    if (characterType === CHARACTERS_TYPE.NIGHTSHADE) {
      character = new NightShadeCharacter(this, id, nickname, characterType, 100, 100)
    }
    if (!character) {
      console.error('Unknown character type: %s', characterType)
      return
    }
    this.addEntity(character)
    return character
  }

  removePlayer(id) {
    const player = this.getPlayer(id)
    if (!player) return
    Matter.World.remove(this._engine.world, player.body)
    this._entities = this._entities.filter(object => object !== player)
  }

  getSyncPacket() {
    const packet = new GamePacket()

    const players = this.getPlayers()
    packet.writeInt32(players.length)
    for (const player of players) {
      packet.writeString(player.id)
        .writeInt16(player.characterType)
        .writeString(player.nickname)
        .writeFloat32(player.body.position.x)
        .writeFloat32(player.body.position.y)
        .writeFloat32(player.body.angle)
        .writeFloat32(player.body.angularVelocity)
        .writeFloat32(player.body.angularSpeed)
        .writeFloat32(player.body.velocity.x)
        .writeFloat32(player.body.velocity.y)
        .writeInt32(player.health)
        .writeInt32(player.killCount)
    }

    const worldItems = this.getEntities(WorldItem)
    packet.writeInt32(worldItems.length)
    for (const worldItem of worldItems) {
      packet.writeString(worldItem.id)
        .writeFloat32(worldItem.body.position.x)
        .writeFloat32(worldItem.body.position.y)
        .writeFloat32(worldItem.body.angle)
        .writeFloat32(worldItem.body.angularVelocity)
        .writeFloat32(worldItem.body.angularSpeed)
        .writeFloat32(worldItem.body.velocity.x)
        .writeFloat32(worldItem.body.velocity.y)
    }
    return packet.getData()
  }

  /**
     *
     * @param {GamePacket} packet
     * @returns {void}
     * */
  async setSyncPacket(scene, packet) {
    const serverPlayerCount = packet.readInt32()
    const serverPlayers = []
    // Read server players
    for (let i = 0; i < serverPlayerCount; i++) {
      serverPlayers.push({
        id: packet.readString(),
        characterType: packet.readInt16(),
        nickname: packet.readString(),
        x: packet.readFloat32(),
        y: packet.readFloat32(),
        angle: packet.readFloat32(),
        angularVelocity: packet.readFloat32(),
        angularSpeed: packet.readFloat32(),
        velocityX: packet.readFloat32(),
        velocityY: packet.readFloat32(),
        health: packet.readInt32(),
        killCount: packet.readInt32(),
      })
    }
    // Read server world items
    const serverWorldItemCount = packet.readInt32()
    const serverWorldItems = []
    for (let i = 0; i < serverWorldItemCount; i++) {
      serverWorldItems.push({
        id: packet.readString(),
        x: packet.readFloat32(),
        y: packet.readFloat32(),
        angle: packet.readFloat32(),
        angularVelocity: packet.readFloat32(),
        angularSpeed: packet.readFloat32(),
        velocityX: packet.readFloat32(),
        velocityY: packet.readFloat32(),
      })
    }
    // Update world items
    for (const worldItem of this.getEntities(WorldItem)) {
      const serverWorldItem = serverWorldItems.find(wi => wi.id === worldItem.id)
      if (!serverWorldItem) continue
      Matter.Body.setPosition(worldItem.body, { x: serverWorldItem.x, y: serverWorldItem.y })
      Matter.Body.setAngle(worldItem.body, serverWorldItem.angle)
      Matter.Body.setAngularVelocity(worldItem.body, serverWorldItem.angularVelocity)
      Matter.Body.setAngularSpeed(worldItem.body, serverWorldItem.angularSpeed)
      Matter.Body.setVelocity(worldItem.body, { x: serverWorldItem.velocityX, y: serverWorldItem.velocityY })
    }

    // Remove old players
    for (const player of this.getPlayers()) {
      if (serverPlayers.find(p => p.id === player.id)) continue
      this.removeEntity(player)
    }
    // Add new players
    for (const player of serverPlayers) {
      if (this.getPlayer(player.id)) continue
      const newPlayer = this.addPlayer(player.id, player.nickname, player.characterType)
      await newPlayer.initGraphics(scene)
      console.log('[%s] Player "%s"(%s) joined the world',
        new Date().toISOString(),
        newPlayer.nickname,
        newPlayer.id
      )
    }
    // Update client players to server players
    for (const player of this.getPlayers()) {
      const serverPlayer = serverPlayers.find(p => p.id === player.id)
      if (!serverPlayer) continue
      Matter.Body.setPosition(player.body, { x: serverPlayer.x, y: serverPlayer.y })
      Matter.Body.setAngle(player.body, serverPlayer.angle)
      Matter.Body.setAngularVelocity(player.body, serverPlayer.angularVelocity)
      Matter.Body.setAngularSpeed(player.body, serverPlayer.angularSpeed)
      Matter.Body.setVelocity(player.body, { x: serverPlayer.velocityX, y: serverPlayer.velocityY })
      player.health = serverPlayer.health
      player.killCount = serverPlayer.killCount
    }

  }
}