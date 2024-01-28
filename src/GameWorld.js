import Matter from 'matter-js';
import * as PIXI from 'pixi.js';

class Floor {
    constructor(gameWorld, x, y, width, height) {
        const body = Matter.Bodies.rectangle(x, y, width, height, { isStatic: true });
        /** @type {GameWorld} */
        this._gameWorld = gameWorld;
        this.body = body;
        this.graphics = null;
    }

    async initGraphics() {
        const container = new PIXI.Container();

        const texture = await PIXI.Assets.load((await import('@/assets/ground.jpg')).default);
        const sprite = new PIXI.Sprite(texture);
        sprite.anchor.set(0.5);
        sprite.width = this.body.bounds.max.x - this.body.bounds.min.x;
        sprite.height = this.body.bounds.max.y - this.body.bounds.min.y;
        container.addChild(sprite);

        this.graphics = container;
        return container;
    }
}


class Player {
    constructor(gameWorld, id, x, y) {
        const body = Matter.Bodies.rectangle(x, y, 80, 80);
        /** @type {GameWorld} */
        this._gameWorld = gameWorld;
        this.id = id;
        this.body = body;
        this.graphics = null;

        this._canJump = false;

        const engine = this._gameWorld.engine;
        Matter.Events.on(engine, 'collisionStart', (event) => {
            for (const pair of event.pairs) {
                if (pair.bodyA === this.body || pair.bodyB === this.body) {
                    this._canJump = true;
                }
            }
        });
        Matter.Events.on(engine, 'collisionEnd', (event) => {
            for (const pair of event.pairs) {
                if (pair.bodyA === this.body || pair.bodyB === this.body) {
                    this._canJump = false;
                }
            }
        });
    }

    async initGraphics() {
        const container = new PIXI.Container();
        const bunnyTexture = await PIXI.Assets.load((await import('@/assets/bunny.png')).default);
        const bunny = new PIXI.Sprite(bunnyTexture);
        bunny.anchor.set(0.5);
        bunny.width = this.body.bounds.max.x - this.body.bounds.min.x;
        bunny.height = this.body.bounds.max.y - this.body.bounds.min.y;
        container.addChild(bunny);
        this.graphics = container;
        return container;
    }

    moveForward() {
        //Matter.Body.setVelocity(this.body, { x: 10, y: this.body.velocity.y });
        Matter.Body.applyForce(this.body, this.body.position, { x: 0.2, y: 0 });
    }

    moveBackward() {
        //Matter.Body.setVelocity(this.body, { x: -10, y: this.body.velocity.y });
        Matter.Body.applyForce(this.body, this.body.position, { x: -0.2, y: 0 });
    }

    jump() {
        if (this._canJump)
            Matter.Body.applyForce(this.body, this.body.position, { x: 0, y: -0.2 });
    }

    attack() {
        const gameWorld = this._gameWorld;
        const player = this;
        for (const otherPlayer of gameWorld.getPlayers()) {
            if (otherPlayer === player) continue;
            const dx = otherPlayer.body.position.x - player.body.position.x;
            const dy = otherPlayer.body.position.y - player.body.position.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance > 250) continue;
            const angle = Math.atan2(dy, dx);
            const force = 0.5;
            const fx = force * Math.cos(angle);
            const fy = force * Math.sin(angle);
            Matter.Body.applyForce(otherPlayer.body, otherPlayer.body.position, { x: fx, y: fy });
        }

    }
}

export default class GameWorld {

    constructor() {
        this._engine = Matter.Engine.create();
        this._objects = [];
    }

    get engine() {
        return this._engine;
    }

    get world() {
        return this._engine.world;
    }

    /**
     * 
     * @returns {Floor[]}
     */
    getFloors() {
        return this._objects.filter(object => object instanceof Floor) || [];
    }

    /**
     * 
     * @returns {Player[]}
     */
    getPlayers() {
        return this._objects.filter(object => object instanceof Player) || [];
    }

    /** @returns {Player} */
    getPlayer(id) {
        return this._objects.find(player => player.id === id);
    }

    start() {
        this.addFloor(0, 600, 3000, 60);

        let _lastTick = Date.now();
        const tick = () => {
            const now = Date.now();
            const delta = now - _lastTick;
            _lastTick = now;
            console.log(delta)
        }

        setInterval(tick, 1000 / 60);
    }

    addFloor(x, y, width, height) {
        const floor = new Floor(this, x, y, width, height);
        Matter.World.add(this.world, floor.body);
        this._objects.push(floor);
    }

    addPlayer(id) {
        const player = new Player(this, id, 100, 100);
        Matter.World.add(this._engine.world, player.body);
        this._objects.push(player);
        return player;
    }

    removePlayer(id) {
        const player = this.getPlayer(id);
        if (!player) return;
        Matter.World.remove(this._engine.world, player.body);
        this._objects = this._objects.filter(object => object !== player);
    }

    playerMoveForward(id) {
        const player = this.getPlayer(id);
        if (!player) return;
        player.moveForward();
    }

    playerMoveBackward(id) {
        const player = this.getPlayer(id);
        if (!player) return;
        player.moveBackward();
    }

    playerJump(id) {
        const player = this.getPlayer(id);
        if (!player) return;
        player.jump();
    }

    playerAttack(id) {
        const player = this.getPlayer(id);
        if (!player) return;
        player.attack();
    }
}