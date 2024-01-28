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
    constructor(gameWorld, id, nickname, x, y) {
        const body = Matter.Bodies.rectangle(x, y, 80, 80);
        /** @type {GameWorld} */
        this._gameWorld = gameWorld;
        this.id = id;
        this.nickname = nickname;
        this.body = body;
        this.graphics = null;
        
        this._health = 100;
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

    get health() {
        return this._health;
    }

    set health(value) {
        this._health = value;
        if (this._health < 0) {
            this._health = 0;
        }
        if (this.graphics === null) return;
        const healthBar = this.graphics.getChildByName('healthBar')
        healthBar.clear();
        healthBar.beginFill(0xff0000);
        healthBar.drawRect(0, 0, 100, 10);
        healthBar.endFill();
        healthBar.beginFill(0x00ff00);
        healthBar.drawRect(0, 0, this._health, 10);
        healthBar.endFill();
    }

    async initGraphics() {
        const container = new PIXI.Container();
        
        // Bunny
        const bunnyTexture = await PIXI.Assets.load((await import('@/assets/bunny.png')).default);
        const bunny = new PIXI.Sprite(bunnyTexture);
        bunny.anchor.set(0.5);
        bunny.width = this.body.bounds.max.x - this.body.bounds.min.x;
        bunny.height = this.body.bounds.max.y - this.body.bounds.min.y;
        container.addChild(bunny);

        // Health bar
        const healthBar = new PIXI.Graphics();
        healthBar.name = 'healthBar';
        healthBar.beginFill(0xff0000);
        healthBar.drawRect(0, 0, 100, 10);
        healthBar.endFill();
        healthBar.beginFill(0x00ff00);
        healthBar.drawRect(0, 0, this._health, 10);
        healthBar.endFill();
        healthBar.position.set(-50, -60);
        container.addChild(healthBar);

        // Nickname
        const nicknameText = new PIXI.Text(this.nickname, {
            fill: 0xffffff,
            align: 'center',
        });
        nicknameText.anchor.set(0.5);
        nicknameText.position.set(0, -80);
        container.addChild(nicknameText);

        this.graphics = container;
        return container;
    }

    moveForward() {
        //Matter.Body.setVelocity(this.body, { x: 10, y: this.body.velocity.y });
        Matter.Body.applyForce(this.body, this.body.position, { x: 0.05, y: 0 });
    }

    moveBackward() {
        //Matter.Body.setVelocity(this.body, { x: -10, y: this.body.velocity.y });
        Matter.Body.applyForce(this.body, this.body.position, { x: -0.05, y: 0 });
    }

    jump() {
        if (this._canJump)
            Matter.Body.applyForce(this.body, this.body.position, { x: 0, y: -0.3 });
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
            otherPlayer.health -= 10;
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

    start(tickRate = 20) {
        this.addFloor(0, 600, 2000, 300);

        let lastTime  = Date.now();
        const tick = () => {
            const currTime = 0.001 * Date.now();
            Matter.Engine.update(this._engine, 1000 / tickRate, lastTime ? currTime / lastTime : 1);
            lastTime  = currTime;
            // check any player is out of the world
            const players = this.getPlayers();
            for (const player of players) {
                if (player.body.position.y > 1000 || player.health <= 0) {
                    Matter.Body.setPosition(player.body, { x: 100, y: 100 });
                    Matter.Body.setVelocity(player.body, { x: 0, y: 0 });
                    Matter.Body.setAngle(player.body, 0);
                    Matter.Body.setAngularVelocity(player.body, 0);
                    Matter.Body.setAngularSpeed(player.body, 0);
                    player.health = 100;
                }
                
            }
        }

        setInterval(tick, 1000 / tickRate);
    }

    addFloor(x, y, width, height) {
        const floor = new Floor(this, x, y, width, height);
        Matter.World.add(this.world, floor.body);
        this._objects.push(floor);
    }

    addPlayer(id, nickname) {
        const player = new Player(this, id, nickname, 100, 100);
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