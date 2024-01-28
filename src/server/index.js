import { Server } from 'socket.io';
import moment from 'moment';

import GameWorld from '../GameWorld.js';
import GamePacket from '../GamePacket.js';

const io = new Server(8888, {
    cors: {
        origin: '*',
    },
});

const gameWorld = new GameWorld();

gameWorld.start();

gameWorld.addPlayer('player1');

let sockets = [];

function broadcastWorldEvent(event, data) {
    for (const socket of sockets) {
        socket.emit(event, data);
    }
}

io.on('connection', (socket) => {


    console.log('[%s] Connected', moment().format('YYYY-MM-DD HH:mm:ss'), socket.id);
    sockets.push(socket);

    socket.on('disconnect', () => {
        console.log('[%s] Disconnected', moment().format('YYYY-MM-DD HH:mm:ss'), socket.id);
        gameWorld.removePlayer(socket.id);
        sockets = sockets.filter(s => s.id !== socket.id);
    });

    socket.on('join_world', () => {
        gameWorld.addPlayer(socket.id);
    });

    socket.on('ping', () => {
        socket.emit('pong');
    });

    socket.on('world_event', (action) => {
        const {
            type,
            data,
        } = action;
        console.log('[%s] World event: %s', moment().format('YYYY-MM-DD HH:mm:ss'), type, data);
        switch (type) {
            case 'player_move_forward': {
                const { id } = data;
                gameWorld.playerMoveForward(id);
                broadcastWorldEvent('world_event', { type: 'move_forward', data: { id } });
                break;
            }
            case 'player_move_backward': {
                const { id } = data;
                gameWorld.playerMoveBackward(id);
                broadcastWorldEvent('world_event', { type: 'move_backward', data: { id } });
                break;
            }
            case 'player_jump': {
                const { id } = data;
                gameWorld.playerJump(id);
                broadcastWorldEvent('world_event', { type: 'jump', data: { id } });
                break;
            }
            case 'player_attack': {
                const { id } = data;
                gameWorld.playerAttack(id);
                broadcastWorldEvent('world_event', { type: 'attack', data: { id } });
                break;
            }
        }
    });

});

//
// Sync all players every 20 fps
//
const syncAllPlayers = () => {
    const players = gameWorld.getPlayers();
    const packet = new GamePacket();
    packet.writeInt8(players.length);
    for (const player of players) {
        packet.writeString(player.id);
        packet.writeFloat32(player.body.position.x);
        packet.writeFloat32(player.body.position.y);
        packet.writeFloat32(player.body.angle);
        packet.writeFloat32(player.body.velocity.x);
        packet.writeFloat32(player.body.velocity.y);
    }
    broadcastWorldEvent('sync_world', packet.getData());
}
setInterval(syncAllPlayers, 1000);

setInterval(() => {
    console.log('[%s] Players: %s', moment().format('YYYY-MM-DD HH:mm:ss'), gameWorld.getPlayers().length);
}, 3000);
