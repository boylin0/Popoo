'use client'

import * as PIXI from 'pixi.js'
import { Sprite } from 'pixi.js'

import GamePacket, { CHARACTERS_TYPE, PACKET_TYPE } from '@/shared/GamePacket'
import { Utils } from '@/shared/GameWorld'

import WorldScene from './WorldScene'

class MenuScene extends PIXI.Container {

  constructor(app) {
    super()
    /** @type {import('@/app/App').GameApplication} */
    this._app = app
    this._initScene()
    this._isInit = false

    this.selectedCharacter = 0
    this.charactors = []
  }

  async _initScene() {

    // game title
    const [
      gavinTexture,
      nightshadeTexture,
    ] = await Utils.loadAssets([
      import('@/assets/gavin/gavin_idle00.png'),
      import('@/assets/nightshade/nightshade_idle00.png'),
    ])
    this.charactors = [
      {
        name: 'Gavin',
        typeId: CHARACTERS_TYPE.GAVIN,
        texture: gavinTexture,
      },
      {
        name: 'NightShade',
        typeId: CHARACTERS_TYPE.NIGHTSHADE,
        texture: nightshadeTexture,
      },
    ]

    // character
    const charactorSprite = new Sprite(this.getSelectedCharacter().texture)
    charactorSprite.name = 'charactorSprite'
    charactorSprite.anchor.set(0.5)
    charactorSprite.position.set(this._app.renderer.width / 2, this._app.renderer.height / 2 - 200)
    this.addChild(charactorSprite)
    this._titleSprite = charactorSprite

    // character name
    const charactorName = new PIXI.Text(this.getSelectedCharacter().name, {
      fill: 0xffffff,
      align: 'center',
    })
    charactorName.name = 'charactorName'
    charactorName.style.fontSize = 40
    charactorName.style.fontWeight = 'bold'
    charactorName.anchor.set(0.5)
    charactorName.position.set(this._app.renderer.width / 2, this._app.renderer.height / 2 - 100)
    this.addChild(charactorName)

    // name input
    const nameInput = document.createElement('input')
    nameInput.value = localStorage.getItem('nickname') || 'Noob-' + Math.floor(Math.random() * 1000)
    nameInput.type = 'text'
    nameInput.placeholder = 'Enter your name'
    nameInput.style.position = 'absolute'
    nameInput.style.left = '50%'
    nameInput.style.bottom = '30%'
    nameInput.style.transform = 'translate(-50%, -50%)'
    nameInput.style.width = '300px'
    nameInput.style.height = '50px'
    nameInput.maxLength = 12
    nameInput.style.borderRadius = '10px'
    nameInput.style.border = 'none'
    nameInput.style.padding = '10px'
    nameInput.style.fontSize = '20px'
    nameInput.style.textAlign = 'center'
    nameInput.style.color = '#000000'
    nameInput.style.backgroundColor = '#ffffff'

    this._nameInput = nameInput
    document.body.appendChild(nameInput)

    // choose right button
    const [
      rightButtonTexture,
    ] = await Utils.loadAssets([
      import('@/assets/right-button.png'),
    ])

    const rightButton = new Sprite(rightButtonTexture)
    rightButton.name = 'rightButton'
    rightButton.anchor.set(0.5)
    rightButton.position.set(this._app.renderer.width / 2 + 200, this._app.renderer.height / 2)
    rightButton.width = 50
    rightButton.height = 50
    rightButton.eventMode = 'static'
    rightButton.on('pointerdown', () => {
      this.nextCharacter()
    })
    rightButton.on('pointerover', () => {
      rightButton.width *= 1.1
      rightButton.height *= 1.1
    })
    rightButton.on('pointerout', () => {
      rightButton.width /= 1.1
      rightButton.height /= 1.1
    })
    this.addChild(rightButton)

    // choose left button
    const leftButton = new Sprite(rightButtonTexture)
    leftButton.name = 'leftButton'
    leftButton.anchor.set(0.5)
    leftButton.position.set(this._app.renderer.width / 2 - 200, this._app.renderer.height / 2)
    leftButton.width = 50
    leftButton.height = 50
    leftButton.eventMode = 'static'
    leftButton.rotation = Math.PI
    leftButton.on('pointerdown', () => {
      this.prevCharacter()
    })
    leftButton.on('pointerover', () => {
      leftButton.width *= 1.1
      leftButton.height *= 1.1
    })
    leftButton.on('pointerout', () => {
      leftButton.width /= 1.1
      leftButton.height /= 1.1
    })
    this.addChild(leftButton)

    // play button
    const playButton = new PIXI.Text('PLAY', {
      fill: 0xffffff,
      align: 'center',
    })
    playButton.name = 'playButton'
    playButton.style.fontSize = 80
    playButton.anchor.set(0.5)
    playButton.position.set(this._app.renderer.width / 2, this._app.renderer.height / 2)
    playButton.eventMode = 'static'
    playButton.buttonMode = true
    playButton.on('pointerdown', () => {

      nameInput.style.display = 'none'
      document.body.removeChild(nameInput)

      const packet = new GamePacket()
      packet.writeInt16(PACKET_TYPE.JOIN_WORLD)
      packet.writeString(nameInput.value)
      packet.writeInt16(this.getSelectedCharacter().typeId)
      this._app.socketio.emit('packet', packet.getData())

      localStorage.setItem('nickname', nameInput.value)
      this.destroy()
      const worldScene = new WorldScene(this._app)
      this._app.stage.addChild(worldScene)
    })
    playButton.on('pointerover', () => {
      playButton.scale.set(1.1)
    })
    playButton.on('pointerout', () => {
      playButton.scale.set(1)
    })

    this._playButton = playButton
    this.addChild(playButton)

    this._isInit = true
  }

  setSelectedCharacter(index) {
    this.selectedCharacter = index
    const charactorName = this.getChildByName('charactorName')
    const charactorSprite = this.getChildByName('charactorSprite')
    charactorName.text = this.getSelectedCharacter().name
    charactorSprite.texture = this.getSelectedCharacter().texture
  }

  getSelectedCharacter() {
    return this.charactors[this.selectedCharacter]
  }

  nextCharacter() {
    this.setSelectedCharacter((this.selectedCharacter + 1) % this.charactors.length)
  }

  prevCharacter() {
    this.setSelectedCharacter((this.selectedCharacter - 1 + this.charactors.length) % this.charactors.length)
  }

  update() {
    if (!this._isInit) return
    const playButton = this.getChildByName('playButton')
    const charactorName = this.getChildByName('charactorName')
    const charactorSprite = this.getChildByName('charactorSprite')
    const leftButton = this.getChildByName('leftButton')
    const rightButton = this.getChildByName('rightButton')
    playButton.position.set(this._app.renderer.width / 2, this._app.renderer.height / 2)
    charactorName.position.set(this._app.renderer.width / 2, this._app.renderer.height / 2 - 100)
    charactorSprite.position.set(this._app.renderer.width / 2, this._app.renderer.height / 2 - 200)
    leftButton.position.set(this._app.renderer.width / 2 - 200, this._app.renderer.height / 2)
    rightButton.position.set(this._app.renderer.width / 2 + 200, this._app.renderer.height / 2)
  }
}

export default MenuScene