'use client';

import { useEffect, useRef } from 'react';

import * as PIXI from 'pixi.js';
import { Application, Assets, Sprite } from 'pixi.js';

import Matter from 'matter-js';

class KeyboardInput {
    constructor() {
        this._keys = {};
        window.addEventListener('keydown', this._keyDown.bind(this));
        window.addEventListener('keyup', this._keyUp.bind(this));
    }

    dispose() {
        window.removeEventListener('keydown', this._keyDown.bind(this));
        window.removeEventListener('keyup', this._keyUp.bind(this));
    }

    _keyDown(e) {
        this._keys[e.key] = true;
    }

    _keyUp(e) {
        this._keys[e.key] = false;
    }

    isKeyPressed(key) {
        return this._keys[key] === true;
    }
}

class GameObject {
    constructor(x, y, width, height) {
        this._sprite = null;
        this._matterBody = null;
        this._position = { x, y };
        this.HEIGHT = height;
        this.WIDTH = width;
    }

    async init(gameObjectImage) {

        const gameObjectTexture = await Assets.load(gameObjectImage.default);
        const gameObjectSprite = new Sprite(gameObjectTexture);
        gameObjectSprite.anchor.set(0.5);
        gameObjectSprite.position.set(this._position.x, this._position.y);
        gameObjectSprite.width = this._matterBody.bounds.max.x - this._matterBody.bounds.min.x;
        gameObjectSprite.height = this._matterBody.bounds.max.y - this._matterBody.bounds.min.y;
        this._sprite = gameObjectSprite;
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
        return this._sprite;
    }

}

// Example usage for Ground
class Ground extends GameObject {
    constructor(x, y, width, height) {
        super(x, y, width, height);
        this.initMatterBody(Matter.Bodies.rectangle(x, y, width, height, { isStatic: true }));
    }
}

// Example usage for Bunny
class Bunny extends GameObject {
    constructor(x, y) {
        super(x, y, 80, 80);
        this.initMatterBody(Matter.Bodies.rectangle(x, y, 80, 80));
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

    canJump() {
        return this._matterBody.velocity.y === 0;
    }

    jump() {
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
        this._keyboard = new KeyboardInput();
        this._isInitWorld = false;
        this.initWorld();
    }

    async initWorld() {
        // init matter.js
        const engine = Matter.Engine.create();
        const world = engine.world;

        const ground = new Ground(400, 610, 1500, 60, { isStatic: true });
        const myBunny = new Bunny(400, 300, 80, 80);

        await ground.init(await import('@/assets/ground.jpg'));
        await myBunny.init(await import('@/assets/bunny.png'));

        Matter.World.add(world, [
            ground.matterBody,
            myBunny.matterBody
        ]);

        for (let i = 0; i < 10; i++) {
            const bunny = new Bunny(400 + i * 100, 300, 80, 80);
            await bunny.init(await import('@/assets/bunny.png'));
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

    update() {
        if (!this._isInitWorld) return;

        const bodies = this._bodies
        for (const body of bodies) {
            body.sprite.position.x = body.matterBody.position.x;
            body.sprite.position.y = body.matterBody.position.y;
            body.sprite.rotation = body.matterBody.angle;
        }

        this.targetCameraToSprite(this._myBunny.sprite);

        if (this._keyboard.isKeyPressed('ArrowLeft')) {
            this._myBunny.moveForward();
        }
        if (this._keyboard.isKeyPressed('ArrowRight')) {
            this._myBunny.moveBackward();
        }

        if (this._keyboard.isKeyPressed(' ') || this._keyboard.isKeyPressed('ArrowUp')) {
            if (this._myBunny.canJump()) {
                this._myBunny.jump();
                console.log('jump')
            }
        }
    }
}

export default function ThePopooGame() {

    const ref = useRef(null);

    const initGame = async () => {
        if (!ref.current) return;

        const app = new Application({
            resizeTo: window,
        });

        const worldScene = new WorldScene(app);
        app.stage = worldScene;

        app.ticker.add(() => {
            worldScene.update();
        });

        /** @type {HTMLDivElement} */
        const div = ref.current;
        div.replaceWith(app.view);
    }

    useEffect(() => {
        initGame();
    }, []);

    return <div ref={ref} style={{
        height: '100vh',
        width: '100vw',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        fontSize: '3rem',
    }}>
        LOADING
    </div>;

}