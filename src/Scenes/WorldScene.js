'use client';

import * as PIXI from 'pixi.js';
import { Application, Assets, Sprite } from 'pixi.js';

import Matter from 'matter-js';
import GameWorld, { Utils } from '@/GameWorld';
import GamePacket, { PACKET_TYPE, WORLD_EVENT } from '@/GamePacket';

class WorldScene extends PIXI.Container {

    constructor(app) {
        super();
        /** @type {import('@/app/App').GameApplication} */
        this._app = app;
        this._renderObjects = [];
        this._myBunny = null;
        this._camera = { x: 0, y: 0 };
        this._isInitWorld = false;
        this._keyboard = null;
        this.initScene();
    }

    async initScene() {

        const [
            backgroundTexture,
        ] = await Utils.loadAssets([
            import('@/assets/background.png'),
        ]);

        backgroundTexture.baseTexture.setRealSize(50, 50);
        const background = new PIXI.TilingSprite(backgroundTexture, 10000, 10000);
        background.anchor.set(0.5);
        this.addChild(background);

        const socketio = this._app.socketio;

        const gameWorld = new GameWorld();

        gameWorld.start(170);

        socketio.on('packet', async (data) => {
            const packet = new GamePacket(data);
            const type = packet.readInt16();
            switch (type) {
                case PACKET_TYPE.WORLD_EVENT: {
                    const event = packet.readInt16();
                    switch (event) {
                        case WORLD_EVENT.PLAYER_MOVE_FORWARD: {
                            const id = packet.readString();
                            if (id === socketio.id) break;
                            gameWorld.playerMoveForward(id);
                            break;
                        }
                        case WORLD_EVENT.PLAYER_MOVE_FORWARD_END: {
                            const id = packet.readString();
                            if (id === socketio.id) break;
                            gameWorld.playerMoveForwardEnd(id);
                            break;
                        }
                        case WORLD_EVENT.PLAYER_MOVE_BACKWARD: {
                            const id = packet.readString();
                            if (id === socketio.id) break;
                            gameWorld.playerMoveBackward(id);
                            break;
                        }
                        case WORLD_EVENT.PLAYER_MOVE_BACKWARD_END: {
                            const id = packet.readString();
                            if (id === socketio.id) break;
                            gameWorld.playerMoveBackwardEnd(id);
                            break;
                        }
                        case WORLD_EVENT.PLAYER_JUMP: {
                            const id = packet.readString();
                            if (id === socketio.id) break;
                            gameWorld.playerJump(id);
                            break;
                        }
                        case WORLD_EVENT.PLAYER_ATTACK: {
                            const id = packet.readString();
                            if (id === socketio.id) break;
                            gameWorld.playerAttack(id);
                            break;
                        }
                    }
                    break;
                }
                case PACKET_TYPE.SYNC_WORLD: {
                    const clientPlayers = gameWorld.getPlayers();
                    const serverPlayers = [];
                    const serverPlayerCount = packet.readInt32();
                    for (let i = 0; i < serverPlayerCount; i++) {
                        const id = packet.readString();
                        const nickname = packet.readString();
                        const x = packet.readFloat32();
                        const y = packet.readFloat32();
                        const angle = packet.readFloat32();
                        const angleVelocity = packet.readFloat32();
                        const angularSpeed = packet.readFloat32();
                        const vx = packet.readFloat32();
                        const vy = packet.readFloat32();
                        const health = packet.readInt32();
                        const killCount = packet.readInt32();
                        serverPlayers.push({ id, nickname, killCount, x, y, angle, angleVelocity, angularSpeed, vx, vy, health });
                    }
                    // Add new players
                    for (const player of serverPlayers) {
                        if (clientPlayers.find(p => p.id === player.id)) continue;
                        const newPlayer = gameWorld.addPlayer(player.id, player.nickname);
                        await newPlayer.initGraphics(this);
                        this._renderObjects.push(newPlayer);
                    }
                    // Remove old players
                    for (const player of clientPlayers) {
                        if (serverPlayers.find(p => p.id === player.id)) continue;
                        gameWorld.removePlayer(player.id);
                        player.disposeGraphics(this);
                        this._renderObjects = this._renderObjects.filter(o => o.id !== player.id);
                    }
                    // Update client players to server players
                    for (const player of clientPlayers) {
                        const serverPlayer = serverPlayers.find(p => p.id === player.id);
                        if (!serverPlayer) continue;
                        Matter.Body.setPosition(player.body, { x: serverPlayer.x, y: serverPlayer.y });
                        Matter.Body.setAngle(player.body, serverPlayer.angle);
                        Matter.Body.setAngularVelocity(player.body, serverPlayer.angleVelocity);
                        Matter.Body.setAngularSpeed(player.body, serverPlayer.angularSpeed);
                        Matter.Body.setVelocity(player.body, { x: serverPlayer.vx, y: serverPlayer.vy });
                        player.health = serverPlayer.health;
                        player.killCount = serverPlayer.killCount;
                    }
                    break;
                }
            }
        });

        const floors = gameWorld.getFloors();
        const players = gameWorld.getPlayers();

        for (const floor of floors) {
            console.log('floor', floor);
            await floor.initGraphics(this);
            this._renderObjects.push(floor);
        }

        for (const player of players) {
            console.log('player', player);
            await player.initGraphics(this);
            this._renderObjects.push(player);
        }

        //this._myBunny = gameWorld.get

        this._world = gameWorld;

        /** @type {Keyboard} */
        this._keyboard = await import('pixi.js-keyboard');

        // init pixi.js
        this._camera = { x: this.x, y: this.y };
        this.scale.set(0.9);

        this._isInitWorld = true;
    }

    /**
     * 
     * @param {Sprite} sprite
     */
    targetCameraToSprite(sprite, speed = 0.02) {
        if (!sprite) return;
        this._camera.x = -sprite.position.x + this._app.renderer.width / 2;
        this._camera.y = -sprite.position.y + this._app.renderer.height / 2;
        // move gradually
        if (this._camera.x !== this.x || this._camera.y !== this.y) {
            const dx = this._camera.x - this.x;
            const dy = this._camera.y - this.y;
            const d = Math.sqrt(dx * dx + dy * dy);
            if (d < speed) {
                this.x = this._camera.x;
                this.y = this._camera.y;
            } else {
                this.x += dx * speed;
                this.y += dy * speed;
            }
        }
    }

    update(dt) {
        if (!this._isInitWorld) return;

        const renderObjects = this._renderObjects
        for (const object of renderObjects) {
            object.renderGraphics();
        }

        this.targetCameraToSprite(this._world.getPlayer(this._app.socketio.id)?.graphics);

        const world = this._world;
        if (this._keyboard.isKeyPressed('ArrowLeft')) {
            world.playerMoveBackward(this._app.socketio.id);
            const socketio = this._app.socketio;
            socketio.emit('packet', new GamePacket()
                .writeInt16(PACKET_TYPE.WORLD_EVENT)
                .writeInt16(WORLD_EVENT.PLAYER_MOVE_BACKWARD)
                .writeString(socketio.id)
                .getData()
            );
        } else if (this._keyboard.isKeyReleased('ArrowLeft')) {
            world.playerMoveBackwardEnd(this._app.socketio.id);
            const socketio = this._app.socketio;
            socketio.emit('packet', new GamePacket()
                .writeInt16(PACKET_TYPE.WORLD_EVENT)
                .writeInt16(WORLD_EVENT.PLAYER_MOVE_BACKWARD_END)
                .writeString(socketio.id)
                .getData()
            );
        }

        if (this._keyboard.isKeyPressed('ArrowRight')) {
            world.playerMoveForward(this._app.socketio.id);
            const socketio = this._app.socketio;
            socketio.emit('packet', new GamePacket()
                .writeInt16(PACKET_TYPE.WORLD_EVENT)
                .writeInt16(WORLD_EVENT.PLAYER_MOVE_FORWARD)
                .writeString(socketio.id)
                .getData()
            );
        } else if (this._keyboard.isKeyReleased('ArrowRight')) {
            world.playerMoveForwardEnd(this._app.socketio.id);
            const socketio = this._app.socketio;
            socketio.emit('packet', new GamePacket()
                .writeInt16(PACKET_TYPE.WORLD_EVENT)
                .writeInt16(WORLD_EVENT.PLAYER_MOVE_FORWARD_END)
                .writeString(socketio.id)
                .getData()
            );
        }

        if (this._keyboard.isKeyPressed('ArrowUp')) {
            world.playerJump(this._app.socketio.id);
            const socketio = this._app.socketio;
            socketio.emit('packet', new GamePacket()
                .writeInt16(PACKET_TYPE.WORLD_EVENT)
                .writeInt16(WORLD_EVENT.PLAYER_JUMP)
                .writeString(socketio.id)
                .getData()
            );
        } else if (this._keyboard.isKeyReleased('ArrowUp')) {
            const socketio = this._app.socketio;
            socketio.emit('packet', new GamePacket()
                .writeInt16(PACKET_TYPE.WORLD_EVENT)
                .writeInt16(WORLD_EVENT.PLAYER_JUMP_END)
                .writeString(socketio.id)
                .getData()
            );
        }

        if (this._keyboard.isKeyPressed('Space')) {
            world.playerAttack(this._app.socketio.id);
            const socketio = this._app.socketio;
            socketio.emit('packet', new GamePacket()
                .writeInt16(PACKET_TYPE.WORLD_EVENT)
                .writeInt16(WORLD_EVENT.PLAYER_ATTACK)
                .writeString(socketio.id)
                .getData()
            );
        }

        this._keyboard.update();
    }
}

export default WorldScene;