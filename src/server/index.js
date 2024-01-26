import { Server } from 'socket.io';
import moment from 'moment';

import Matter from 'matter-js';

const io = new Server(8888, {
    cors: {
        origin: '*',
    },
});

class GameWorld {

    constructor() {
        this._players = [];
        this._engine = Matter.Engine.create();
    }

    getPlayers() {
        return this._players;
    }

    addPlayer(id) {
        const player = {
            id,
            body: Matter.Bodies.rectangle(0, 0, 50, 50),
        };
        Matter.World.add(this._engine.world, player.body);
        this._players.push(player);
    }

    removePlayer(id) {
        const player = this._players.find(player => player.id === id);
        if (!player) return;
        Matter.World.remove(this._engine.world, player.body);
        this._players = this._players.filter(player => player.id !== id);
    }

    playerMoveForward(id) {
        const player = this._players.find(player => player.id === id);
        if (!player) return;
        Matter.Body.applyForce(player.body, player.body.position, { x: 0.01, y: 0 });
    }

    playerMoveBackward(id) {
        const player = this._players.find(player => player.id === id);
        if (!player) return;
        Matter.Body.applyForce(player.body, player.body.position, { x: -0.01, y: 0 });
    }

    playerJump(id) {
        const player = this._players.find(player => player.id === id);
        if (!player) return;
        Matter.Body.applyForce(player.body, player.body.position, { x: 0, y: -0.05 });
    }

    playerAttack(id) {
        const player = this._players.find(player => player.id === id);
        if (!player) return;
        Matter.Body.applyForce(player.body, player.body.position, { x: 0, y: 0 });
    }

    getSyncData() {
        return {
            players: this._players.map(player => ({
                id: player.id,
                position: player.body.position,
                angle: player.body.angle,
            })),
        };
    }

}

const gameWorld = new GameWorld();

io.on('connection', (socket) => {

    console.log('[%s] Connected', moment().format('YYYY-MM-DD HH:mm:ss'), socket.id);

    socket.on('disconnect', () => {
        console.log('[%s] Disconnected', moment().format('YYYY-MM-DD HH:mm:ss'), socket.id);
        gameWorld.removePlayer(socket.id);
    });

    socket.on('join_world', () => {
        gameWorld.addPlayer(socket.id);
    });

    socket.on('player_action', (action) => {
        switch (action) {
            case 'move_forward':
                gameWorld.playerMoveForward(socket.id);
                break;
            case 'move_backward':
                gameWorld.playerMoveBackward(socket.id);
                break;
            case 'jump':
                gameWorld.playerJump(socket.id);
                break;
            case 'attack':
                gameWorld.playerAttack(socket.id);
                break;
        }
    });

});

//
// Sync all players every 20 fps
//
const syncAllPlayers = () => {
    const players = gameWorld.getPlayers();
    for (const player of players) {
        const socket = io.sockets.sockets.get(player.id);
        if (!socket) continue;
        socket.emit('sync_world', gameWorld.getSyncData());
    }
}
setInterval(syncAllPlayers, 1000 / 10);
