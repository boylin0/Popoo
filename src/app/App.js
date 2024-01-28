'use client';

import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import Matter from 'matter-js';

import { Application } from 'pixi.js';

import MenuScene from '@/Scenes/MenuScene';

export class GameApplication extends Application {

    constructor() {
        super({
            resizeTo: window,
        });
        /** @type {SocketIOClient} */
        this._socketio = null;
        this._initScene();
    }

    get world() {
        return this._world;
    }

    get socketio() {
        return this._socketio;
    }

    set socketio(socketio) {
        this._socketio = socketio;
    }

    _initScene() {
        const menuScene = new MenuScene(this);
        this.stage.addChild(menuScene);
        const handleTick = (dt) => {
            this.stage.children.forEach(child => {
                if (child.update) child.update(dt);
            });
        };
        this.ticker.add(handleTick);
    }

}

export default function App() {

    const ref = useRef(null);

    const initGame = async (socket) => {

        if (!ref.current) return;

        // Init PIXI Application
        const app = new GameApplication();
        app.socketio = socket;

        /** @type {HTMLDivElement} */
        const div = ref.current;
        div.replaceWith(app.view);
    }

    useEffect(() => {
        // Init Socket.io
        const socket = io(window.location.hostname + ':8888');
        socket.on('connect', () => {
            initGame(socket);
        });
        return () => {
            socket.close();
        }
    }, []);

    return <div ref={ref} style={{
        height: '100vh',
        width: '100vw',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        fontSize: '3rem',
    }}>
        LOADING THE POPOO GAME...
    </div>;

}