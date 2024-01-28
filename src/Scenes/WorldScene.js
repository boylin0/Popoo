'use client';

import * as PIXI from 'pixi.js';
import { Application, Assets, Sprite } from 'pixi.js';

import Matter from 'matter-js';
import GameWorld from '@/GameWorld';
import GamePacket, { PACKET_TYPE, WORLD_EVENT } from '@/GamePacket';

class GameObject {
    constructor(x, y, width, height) {
        this._container = null;
        this._matterBody = null;
        this._position = { x, y };
        this.HEIGHT = height;
        this.WIDTH = width;
    }

    initMatterBody(matterBody) {
        this._matterBody = matterBody;
    }

    /** @type {MatterBody} */
    get matterBody() {
        return this._matterBody;
    }

    /** @type {Sprite} */
    get sprite() {
        return this._container;
    }

    update(dt) {
        this._container.position.set(this._matterBody.position.x, this._matterBody.position.y);
        this._container.rotation = this._matterBody.angle;
    }

}

// Example usage for Ground
class Ground extends GameObject {
    constructor(x, y, width, height) {
        super(x, y, width, height);
        this.initMatterBody(Matter.Bodies.rectangle(x, y, width, height, { isStatic: true }));
    }

    async init() {
        const gameObjectTexture = await Assets.load((await import('@/assets/ground.jpg')).default);
        const gameObjectSprite = new Sprite(gameObjectTexture);
        gameObjectSprite.anchor.set(0.5);
        gameObjectSprite.position.set(this._position.x, this._position.y);
        gameObjectSprite.width = this._matterBody.bounds.max.x - this._matterBody.bounds.min.x;
        gameObjectSprite.height = this._matterBody.bounds.max.y - this._matterBody.bounds.min.y;
        this._container = gameObjectSprite;
    }
}

// Example usage for Bunny
class Bunny extends GameObject {

    constructor(x, y) {
        super(x, y, 80, 80);
        this.initMatterBody(Matter.Bodies.rectangle(x, y, 80, 80));
        this._onGround = false;
        this._health = 100;
        this._attackCooldown = 0;

        this._healthBar = null;
        this._bunny = null;
        this._container = null;
    }

    async init() {
        const container = new PIXI.Container();

        const bunnyTexture = await Assets.load((await import('@/assets/bunny.png')).default);
        const bunny = new Sprite(bunnyTexture);
        bunny.anchor.set(0.5);
        bunny.width = this._matterBody.bounds.max.x - this._matterBody.bounds.min.x;
        bunny.height = this._matterBody.bounds.max.y - this._matterBody.bounds.min.y;
        this._bunny = bunny;

        this._healthBar = new PIXI.Graphics();

        container.addChild(this._healthBar);
        container.addChild(this._bunny);

        container.position.set(this._position.x, this._position.y);
        this._container = container;

        this.health = 100;
    }

    get health() {
        return this._health;
    }

    set health(value) {
        this._health = value;
        if (this._health < 0) {
            this._health = 0;
        }
        this._healthBar.clear();
        this._healthBar.beginFill(0xff0000);
        this._healthBar.drawRect(-this._bunny.width / 2, -this._bunny.height / 2 - 30, this._bunny.width, 5);
        this._healthBar.endFill();
        this._healthBar.beginFill(0x00ff00);
        this._healthBar.drawRect(-this._bunny.width / 2, -this._bunny.height / 2 - 30, this._bunny.width * (this._health / 100.0), 5);
        this._healthBar.endFill();
    }

    update() {
        this._container.position.set(this._matterBody.position.x, this._matterBody.position.y);
        this._bunny.rotation = this._matterBody.angle;
    }

    collidesWith(body) {
        return Matter.Collision.collides(this._matterBody, body) !== null;
    }

    moveForward() {
        Matter.Body.setVelocity(this._matterBody, { x: -5, y: this._matterBody.velocity.y });
    }

    moveBackward() {
        Matter.Body.setVelocity(this._matterBody, { x: 5, y: this._matterBody.velocity.y });
    }

    async playAttackAnimation() {
        const container = this._container;
        const graphics = new PIXI.Graphics();
        graphics.beginFill(0xff0000);
        graphics.drawRect(-200 / 2, -200 / 2, 200, 200);
        graphics.endFill();
        graphics.alpha = 0.5;
        container.addChild(graphics);
        await new Promise(resolve => setTimeout(resolve, 100));
        container.removeChild(graphics);
    }

    canAttack() {
        if ((new Date()).getTime() - this._attackCooldown < 1000) {
            return false;
        }
        this._attackCooldown = (new Date()).getTime();
        return true;
    }

    attack(bodies) {
        this.playAttackAnimation();
        for (const body of bodies) {
            if (!body instanceof Bunny) continue
            if (body === this) continue;
            // circle range attack x and y dx * dx + dy * dy <= r * r
            if (Math.abs(body.matterBody.position.x - this.matterBody.position.x) < 200 &&
                Math.abs(body.matterBody.position.y - this.matterBody.position.y) < 200) {
                body.health -= 20;
                const dx = body.matterBody.position.x - this.matterBody.position.x;
                Matter.Body.applyForce(body.matterBody, body.matterBody.position, { x: dx * 0.005, y: -0.5 });
            }
        }
    }

    setGround(engine) {
        Matter.Events.on(engine, 'collisionStart', (event) => {
            const pairs = event.pairs;
            for (const pair of pairs) {
                if (pair.bodyA === this._matterBody || pair.bodyB === this._matterBody) {
                    this._onGround = true;
                }
            }
        });
        Matter.Events.on(engine, 'collisionEnd', (event) => {
            const pairs = event.pairs;
            for (const pair of pairs) {
                if (pair.bodyA === this._matterBody || pair.bodyB === this._matterBody) {
                    this._onGround = false;
                }
            }
        });
    }

    canJump() {
        return this._onGround
    }

    jump() {
        this._onGround = false;
        Matter.Body.applyForce(this._matterBody, this._matterBody.position, { x: 0, y: -0.5 });
    }
}

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

        const socketio = this._app.socketio;

        const gameWorld = new GameWorld();

        gameWorld.start(120);

        socketio.on('packet', async (data) => {
            const packet = new GamePacket(data);
            const type = packet.readInt16();
            switch (type) {
                case PACKET_TYPE.WORLD_EVENT: {
                    const event = packet.readInt16();
                    switch (event) {
                        case WORLD_EVENT.PLAYER_MOVE_FORWARD: {
                            const id = packet.readString();
                            gameWorld.playerMoveForward(id);
                            break;
                        }
                        case WORLD_EVENT.PLAYER_MOVE_BACKWARD: {
                            const id = packet.readString();
                            gameWorld.playerMoveBackward(id);
                            break;
                        }
                        case WORLD_EVENT.PLAYER_JUMP: {
                            const id = packet.readString();
                            gameWorld.playerJump(id);
                            break;
                        }
                        case WORLD_EVENT.PLAYER_ATTACK: {
                            const id = packet.readString();
                            gameWorld.playerAttack(id);
                            break;
                        }
                    }
                    break;
                }
                case PACKET_TYPE.SYNC_WORLD: {
                    const clientPlayers = gameWorld.getPlayers();
                    const serverPlayers = [];
                    const serverPlayerCount = packet.readInt8();
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
        this._camera = { x: this.x, y: this.y};
        this.scale.set(0.9);

        this._isInitWorld = true;
    }

    /**
     * 
     * @param {Sprite} sprite
     */
    targetCameraToSprite(sprite, speed = 0.03) {
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
            world.playerMoveBackward(this._app.socketio.id);
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
            world.playerMoveForward(this._app.socketio.id);
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
            world.playerJump(this._app.socketio.id);
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