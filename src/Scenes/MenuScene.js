'use client';

import * as PIXI from 'pixi.js';
import { Application, Assets, Sprite } from 'pixi.js';

import WorldScene from './WorldScene';

class MenuScene extends PIXI.Container {

    constructor(app) {
        super();
        /** @type {Application} */
        this._app = app;
        this._playButton = null;
        this._titleSprite = null;
        this._initScene();
        this._isInit = false;
    }

    async _initScene() {

        // game title
        const titleTexture = await Assets.load((await import('@/assets/bunny.png')).default);
        const titleSprite = new Sprite(titleTexture);
        titleSprite.anchor.set(0.5);
        titleSprite.position.set(this._app.renderer.width / 2, this._app.renderer.height / 2 - 200);
        this.addChild(titleSprite);
        this._titleSprite = titleSprite;

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
            const socket = this._app.socketio;
            socket.emit('join_world');
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