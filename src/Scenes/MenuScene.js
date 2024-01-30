'use client';

import * as PIXI from 'pixi.js';
import { Application, Assets, Sprite } from 'pixi.js';

import WorldScene from './WorldScene';
import GamePacket, { PACKET_TYPE } from '@/GamePacket';

class MenuScene extends PIXI.Container {

    constructor(app) {
        super();
        /** @type {import('@/app/App').GameApplication} */
        this._app = app;
        this._playButton = null;
        this._titleSprite = null;
        this._initScene();
        this._isInit = false;
    }

    async _initScene() {

        // game title
        const titleTexture = await Assets.load((await import('@/assets/bunny-0.png')).default);
        const titleSprite = new Sprite(titleTexture);
        titleSprite.anchor.set(0.5);
        titleSprite.position.set(this._app.renderer.width / 2, this._app.renderer.height / 2 - 200);
        this.addChild(titleSprite);
        this._titleSprite = titleSprite;

        // name input
        const nameInput = document.createElement('input');
        nameInput.value = localStorage.getItem('nickname') || 'Noob-' + Math.floor(Math.random() * 1000);
        nameInput.type = 'text';
        nameInput.placeholder = 'Enter your name';
        nameInput.style.position = 'absolute';
        nameInput.style.left = '50%';
        nameInput.style.top = '10%';
        nameInput.style.transform = 'translate(-50%, -50%)';
        nameInput.style.width = '300px';
        nameInput.style.height = '50px';
        nameInput.maxLength = 12;
        nameInput.style.borderRadius = '10px';
        nameInput.style.border = 'none';
        nameInput.style.padding = '10px';
        nameInput.style.fontSize = '20px';
        nameInput.style.textAlign = 'center';
        nameInput.style.color = '#000000';
        nameInput.style.backgroundColor = '#ffffff';

        this._nameInput = nameInput;
        document.body.appendChild(nameInput);

        const playButton = new PIXI.Text('PLAY', {
            fill: 0xffffff,
            align: 'center',
        });
        playButton.style.fontSize = 80;
        playButton.anchor.set(0.5);
        playButton.position.set(this._app.renderer.width / 2, this._app.renderer.height / 2);
        playButton.eventMode = 'static'
        playButton.buttonMode = true;
        playButton.on('pointerdown', () => {
            document.body.removeChild(nameInput);
            const packet = new GamePacket();
            packet.writeInt16(PACKET_TYPE.JOIN_WORLD);
            packet.writeString(nameInput.value);
            this._app.socketio.emit('packet', packet.getData());
            localStorage.setItem('nickname', nameInput.value);
            this.destroy();
            const worldScene = new WorldScene(this._app);
            this._app.stage.addChild(worldScene);
        });
        playButton.on('pointerover', () => {
            playButton.scale.set(1.1);
        });
        playButton.on('pointerout', () => {
            playButton.scale.set(1);
        });

        this._playButton = playButton;
        this.addChild(playButton);

        this._isInit = true;
    }

    update() {
        if (!this._isInit) return;
        this._playButton.position.set(this._app.renderer.width / 2, this._app.renderer.height / 2);
        this._titleSprite.position.set(this._app.renderer.width / 2, this._app.renderer.height / 2 - 200);
    }
}

export default MenuScene;