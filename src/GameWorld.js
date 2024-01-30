import Matter from 'matter-js';
import * as PIXI from 'pixi.js';

const TIMESTEP = 1000 / 60;

const Utils = {
    loadAssets: async (imports) => {
        const assets = await Promise.all(imports);
        const textures = [];
        for (const asset of assets) {
            textures.push(await PIXI.Assets.load(asset.default));
        }
        return textures;
    }
}

class Floor {
    constructor(gameWorld, x, y, width, height) {
        const body = Matter.Bodies.rectangle(x, y, width, height, { isStatic: true });
        /** @type {GameWorld} */
        this._gameWorld = gameWorld;
        this.body = body;
        this.graphics = null;
    }

    async initGraphics(scene) {

        const [
            floorTexture,
        ] = await Utils.loadAssets([
            import('@/assets/floor.jpg')
        ]);

        const container = new PIXI.Container();

        const sprite = new PIXI.TilingSprite(floorTexture);
        sprite.anchor.set(0.5);
        sprite.width = this.body.bounds.max.x - this.body.bounds.min.x;
        sprite.height = this.body.bounds.max.y - this.body.bounds.min.y;
        container.addChild(sprite);

        this.graphics = container;

        scene.addChild(container);
        return container;
    }

    renderGraphics() {
        this.graphics.position.set(this.body.position.x, this.body.position.y);
        this.graphics.rotation = this.body.angle;
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

        this._uiGraphics = null;

        this._health = 100;
        this._isGrounded = false;
        this._lastAttacker = null;
        this._killCount = 0;

        this._lastAttackTimestamp = 0;
        this._lastJumpTimestamp = 0;

        const engine = this._gameWorld.engine;
        Matter.Events.on(engine, 'collisionStart', (event) => {
            for (const pair of event.pairs) {
                if (pair.bodyA === this.body || pair.bodyB === this.body) {
                    this._isGrounded = true;
                }
            }
        });
        Matter.Events.on(engine, 'collisionEnd', (event) => {
            for (const pair of event.pairs) {
                if (pair.bodyA === this.body || pair.bodyB === this.body) {
                    this._isGrounded = false;
                }
            }
        });
        Matter.Events.on(engine, 'collisionActive', (event) => {
            for (const pair of event.pairs) {
                if (pair.bodyA === this.body || pair.bodyB === this.body) {
                    this._isGrounded = true;
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
        const healthBar = this._uiGraphics.getChildByName('healthBar')
        healthBar.clear();
        healthBar.beginFill(0xff0000);
        healthBar.drawRect(0, 0, 100, 10);
        healthBar.endFill();
        healthBar.beginFill(0x00ff00);
        healthBar.drawRect(0, 0, this._health, 10);
        healthBar.endFill();
    }

    get killCount() {
        return this._killCount;
    }

    set killCount(value) {
        this._killCount = value;
        if (this._uiGraphics === null) return;
        const killCountText = this._uiGraphics.getChildByName('killCountText');
        killCountText.text = `Kill: ${this._killCount}`;
    }

    newKill() {
        this._killCount++;
        if (this._uiGraphics === null) return;
        const killCountText = this._uiGraphics.getChildByName('killCountText');
        killCountText.text = `Kill: ${this._killCount}`;
    }

    async initGraphics(scene) {

        // load assets
        const bunnyTextureArray = await Utils.loadAssets([
            import('@/assets/bunny-0.png'),
            import('@/assets/bunny-1.png'),
            import('@/assets/bunny-2.png'),
            import('@/assets/bunny-3.png'),
            import('@/assets/bunny-4.png'),
        ]);

        const container = new PIXI.Container();

        // Bunny
        const bunny = new PIXI.AnimatedSprite(bunnyTextureArray);
        bunny.anchor.set(0.5);
        bunny.animationSpeed = 0.1;
        bunny.play();
        bunny.width = this.body.bounds.max.x - this.body.bounds.min.x;
        bunny.height = this.body.bounds.max.y - this.body.bounds.min.y;
        container.addChild(bunny);

        const uiContainer = new PIXI.Container();

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
        uiContainer.addChild(healthBar);

        // Nickname
        const nicknameText = new PIXI.Text(this.nickname, {
            fill: 0xffffff,
            align: 'center',
        });
        nicknameText.anchor.set(0.5);
        nicknameText.position.set(0, -80);
        uiContainer.addChild(nicknameText);

        this._uiGraphics = uiContainer;
        this.graphics = container;

        // strike effect
        const strikeEffect = new PIXI.Graphics();
        strikeEffect.name = 'strikeEffect';
        strikeEffect.beginFill(0x009999);
        strikeEffect.drawCircle(0, 0, 200);
        strikeEffect.endFill();
        strikeEffect.alpha = 0;
        this._uiGraphics.addChild(strikeEffect);

        // kill count
        const killCountText = new PIXI.Text('Kill: 0', {
            fill: 0xffffff,
            align: 'center',
            fontSize: 14,
        });
        killCountText.name = 'killCountText';
        killCountText.anchor.set(0.5);
        killCountText.position.set(0, -120);
        uiContainer.addChild(killCountText);

        scene.addChild(container);
        scene.addChild(uiContainer);
        return container;
    }

    disposeGraphics(scene) {
        scene.removeChild(this.graphics);
        scene.removeChild(this._uiGraphics);
    }

    renderGraphics() {
        this.graphics.position.set(this.body.position.x, this.body.position.y);
        this.graphics.rotation = this.body.angle;
        this._uiGraphics.position.set(this.body.position.x, this.body.position.y - 20);
    }

    moveForward() {
        Matter.Body.setVelocity(this.body, { x: 10, y: this.body.velocity.y });
        //Matter.Body.applyForce(this.body, this.body.position, { x: 0.1, y: 0 });
    }

    moveBackward() {
        Matter.Body.setVelocity(this.body, { x: -10, y: this.body.velocity.y });
        //Matter.Body.applyForce(this.body, this.body.position, { x: -0.1, y: 0 });
    }

    jump() {
        if (Date.now() - this._lastJumpTimestamp < 80) return;
        if (this._isGrounded) {
            Matter.Body.applyForce(this.body, this.body.position, { x: 0, y: -0.3 });
            this._lastJumpTimestamp = Date.now();
        }
    }

    attack() {
        if (Date.now() - this._lastAttackTimestamp < 1000) return;
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
            otherPlayer._lastAttacker = player;
        }
        this._lastAttackTimestamp = Date.now();
        if (this._uiGraphics === null) return;
        const strikeEffect = this._uiGraphics.getChildByName('strikeEffect');
        strikeEffect.alpha = 1;
        const tween = new PIXI.Ticker();
        tween.add((delta) => {
            strikeEffect.alpha -= 0.1 * delta;
            if (strikeEffect.alpha <= 0) {
                tween.stop();
            }
        });
        tween.start();
    }
}

export default class GameWorld {

    constructor() {
        this._engine = Matter.Engine.create();
        this._objects = [];
        this._tickInterval = null;
        this._tickRate = 60;
        this.nextTimestep = null;
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
     * @returns {ItemBall[]}
     */
    getItemBalls() {
        return this._objects.filter(object => object instanceof ItemBall) || [];
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
        // build terrain
        this.addFloor(0, 600, 3000, 300);

        for (let i = 0; i < 10; i++) {
            this.addFloor(-200 + i * 120, 250, 50, 50);
        }

        this.setTickRateAndStartTick(tickRate);
    }

    setTickRateAndStartTick(tickRate) {
        this._tickRate = tickRate;
        const tick = () => {
            this.nextTimestep = this.nextTimestep || Date.now();
            while (Date.now() > this.nextTimestep) {
                this.updatePhiysics();
                Matter.Engine.update(this.engine, TIMESTEP);
                this.nextTimestep += TIMESTEP;
            }
        }
        if (this._tickInterval) {
            clearInterval(this._tickInterval);
        }
        this._tickInterval = setInterval(tick, 1000 / this._tickRate);
    }

    updatePhiysics() {

        // check any player is out of the world
        const players = this.getPlayers();
        for (const player of players) {
            if (player.body.position.y > 1000 || player.health <= 0) {
                Matter.Body.setPosition(player.body, { x: 100, y: 100 });
                Matter.Body.setVelocity(player.body, { x: 0, y: 0 });
                Matter.Body.setAngle(player.body, 0);
                Matter.Body.setAngularVelocity(player.body, 0);
                Matter.Body.setAngularSpeed(player.body, 0);
                player.killCount = 0;
                player.health = 100;
                if (player._lastAttacker) {
                    player._lastAttacker.health = 100;
                    player._lastAttacker.newKill();
                    console.log('[%s] Player \"%s\"(%s) killed player \"%s\"(%s)',
                        new Date().toISOString(),
                        player._lastAttacker.nickname,
                        player._lastAttacker.id,
                        player.nickname,
                        player.id
                    );
                }
            }
        }
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