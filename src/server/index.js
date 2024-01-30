import { Server } from 'socket.io';
import moment from 'moment';

import GameWorld from '../GameWorld.js';
import GamePacket, { PACKET_TYPE, WORLD_EVENT } from '../GamePacket.js';

class ServerApp {
    constructor() {
        this.gameWorld = null;
        this.sockets = [];
    }

    start() {
        console.log('[%s] Server started', moment().format('YYYY-MM-DD HH:mm:ss'));
        this.gameWorld = new GameWorld();
        this.gameWorld.start(60);
        this.io = new Server(8888, {
            cors: {
                origin: '*',
            },
        });
        this.io.on('connection', this.handleConnection.bind(this));

        setInterval(this.syncAllPlayers.bind(this), 1000);
    }

    syncAllPlayers() {
        const players = this.gameWorld.getPlayers();
        const packet = new GamePacket();
        packet.writeInt16(PACKET_TYPE.SYNC_WORLD);
        packet.writeInt32(players.length);
        for (const player of players) {
            packet.writeString(player.id);
            packet.writeString(player.nickname);
            packet.writeFloat32(player.body.position.x);
            packet.writeFloat32(player.body.position.y);
            packet.writeFloat32(player.body.angle);
            packet.writeFloat32(player.body.angularVelocity);
            packet.writeFloat32(player.body.angularSpeed);
            packet.writeFloat32(player.body.velocity.x);
            packet.writeFloat32(player.body.velocity.y);
            packet.writeInt32(player.health);
            packet.writeInt32(player.killCount);
        }
        this.broadcastWorldEvent('packet', packet.getData());
    }

    handleConnection(socket) {

        console.log('[%s] Connected', moment().format('YYYY-MM-DD HH:mm:ss'), socket.id);
        this.sockets.push(socket);

        socket.on('disconnect', () => {
            console.log('[%s] Disconnected', moment().format('YYYY-MM-DD HH:mm:ss'), socket.id);
            this.gameWorld.removePlayer(socket.id);
            this.sockets = this.sockets.filter((s) => s.id !== socket.id);
        });

        socket.on('packet', (data) => {
            const packet = new GamePacket(data);
            const type = packet.readInt16();
            switch (type) {
                case PACKET_TYPE.JOIN_WORLD: {
                    const nickname = packet.readString();
                    this.gameWorld.addPlayer(socket.id, nickname.substring(0, 12));
                    console.log(
                        '[%s] Player \"%s\" joined the world',
                        moment().format('YYYY-MM-DD HH:mm:ss'),
                        nickname
                    );
                    break;
                }
                case PACKET_TYPE.WORLD_EVENT: {
                    const event = packet.readInt16();
                    switch (event) {
                        case WORLD_EVENT.PLAYER_MOVE_FORWARD: {
                            const id = packet.readString();
                            this.gameWorld.playerMoveForward(id);
                            this.broadcastWorldEvent(
                                'packet',
                                new GamePacket()
                                    .writeInt16(PACKET_TYPE.WORLD_EVENT)
                                    .writeInt16(WORLD_EVENT.PLAYER_MOVE_FORWARD)
                                    .writeString(id)
                                    .getData()
                            );
                            console.log(
                                '[%s] Player \"%s\" move forward',
                                moment().format('YYYY-MM-DD HH:mm:ss'),
                                id
                            );
                            break;
                        }
                        case WORLD_EVENT.PLAYER_MOVE_BACKWARD: {
                            const id = packet.readString();
                            this.gameWorld.playerMoveBackward(id);
                            this.broadcastWorldEvent(
                                'packet',
                                new GamePacket()
                                    .writeInt16(PACKET_TYPE.WORLD_EVENT)
                                    .writeInt16(WORLD_EVENT.PLAYER_MOVE_BACKWARD)
                                    .writeString(id)
                                    .getData()
                            );
                            console.log(
                                '[%s] Player \"%s\" move backward',
                                moment().format('YYYY-MM-DD HH:mm:ss'),
                                id
                            );
                            break;
                        }
                        case WORLD_EVENT.PLAYER_JUMP: {
                            const id = packet.readString();
                            this.gameWorld.playerJump(id);
                            this.broadcastWorldEvent(
                                'packet',
                                new GamePacket()
                                    .writeInt16(PACKET_TYPE.WORLD_EVENT)
                                    .writeInt16(WORLD_EVENT.PLAYER_JUMP)
                                    .writeString(id)
                                    .getData()
                            );
                            console.log(
                                '[%s] Player \"%s\" jump',
                                moment().format('YYYY-MM-DD HH:mm:ss'),
                                id
                            );
                            break;
                        }
                        case WORLD_EVENT.PLAYER_ATTACK: {
                            const id = packet.readString();
                            this.gameWorld.playerAttack(id);
                            this.broadcastWorldEvent(
                                'packet',
                                new GamePacket()
                                    .writeInt16(PACKET_TYPE.WORLD_EVENT)
                                    .writeInt16(WORLD_EVENT.PLAYER_ATTACK)
                                    .writeString(id)
                                    .getData()
                            );
                            console.log(
                                '[%s] Player \"%s\" attack',
                                moment().format('YYYY-MM-DD HH:mm:ss'),
                                id
                            );
                            break;
                        }
                    }
                    break;
                }
            }
        });
    }

    broadcastWorldEvent(event, data) {
        for (const socket of this.sockets) {
            socket.emit(event, data);
        }
    }
}

const serverApp = new ServerApp();

serverApp.start();