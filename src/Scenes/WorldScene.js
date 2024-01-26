'use client';

import * as PIXI from 'pixi.js';
import { Application, Assets, Sprite } from 'pixi.js';

import Matter from 'matter-js';

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
        /** @type {Application} */
        this._app = app;
        this._bodies = [];
        this._myBunny = null;
        this._camera = { x: 0, y: 0 };
        this._isInitWorld = false;
        this._keyboard = null;
        this.initScene();
    }

    async initScene() {
        // init matter.js
        const engine = Matter.Engine.create();
        const world = engine.world;

        const ground = new Ground(400, 610, 3000, 60, { isStatic: true });
        const myBunny = new Bunny(400, 300, 80, 80);

        await ground.init();
        await myBunny.init();
        myBunny.setGround(engine);

        Matter.World.add(world, [
            ground.matterBody,
            myBunny.matterBody
        ]);

        this._keyboard = await import('pixi.js-keyboard');

        for (let i = 0; i < 10; i++) {
            const bunny = new Bunny(400 + i * 100, 300, 80, 80);
            await bunny.init();
            Matter.World.add(world, bunny.matterBody);
            this._bodies.push(bunny);
            this.addChild(bunny.sprite);
        }

        // init pixi.js
        this._myBunny = myBunny;
        this._camera = { x: this.x, y: this.y };

        this.addChild(ground.sprite);
        this.addChild(myBunny.sprite);
        this._bodies.push(ground);
        this._bodies.push(myBunny);

        setInterval(function () {
            Matter.Engine.update(engine, 1000 / 120);
        }, 1000 / 120);

        this._isInitWorld = true;
    }

    /**
     * 
     * @param {Sprite} sprite
     */
    targetCameraToSprite(sprite) {
        this._camera.x = -sprite.position.x + this._app.renderer.width / 2;
        this._camera.y = -sprite.position.y + this._app.renderer.height / 2;
        // move gradually
        if (this._camera.x !== this.x || this._camera.y !== this.y) {
            const dx = this._camera.x - this.x;
            const dy = this._camera.y - this.y;
            const d = Math.sqrt(dx * dx + dy * dy);
            const speed = 0.03;
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


        const bodies = this._bodies
        for (const body of bodies) {
            body.update();
        }

        this.targetCameraToSprite(this._myBunny.sprite);

        if (this._keyboard.isKeyDown('ArrowLeft')) {
            this._myBunny.moveForward();
        }
        if (this._keyboard.isKeyDown('ArrowRight')) {
            this._myBunny.moveBackward();
        }

        if (this._keyboard.isKeyDown('ArrowUp')) {
            if (this._myBunny.canJump()) {
                this._myBunny.jump();
                console.log('jump')
            }
        }
        if (this._keyboard.isKeyPressed('Space')) {
            if (this._myBunny.canAttack()) {
                this._myBunny.attack(bodies);
            }
        }

        for (const body of bodies) {
            if (!body instanceof Bunny) continue
            if (body.health === 0 || body.matterBody.position.y > 1000) {
                Matter.Body.setPosition(body.matterBody, { x: 400, y: 300 });
                body.health = 100;
            }
        }

        this._keyboard.update();
    }
}

export default WorldScene;