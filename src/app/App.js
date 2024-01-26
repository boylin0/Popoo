'use client';

import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

import { Application } from 'pixi.js';

import MenuScene from '@/Scenes/MenuScene';

export default function App() {

    const ref = useRef(null);

    const initGame = async (socket) => {

        if (!ref.current) return;

        // Init PIXI Application
        const app = new Application({
            resizeTo: window,
        });
        app.socketio = socket;

        // Load Scene
        const menuScene = new MenuScene(app);
        app.stage.addChild(menuScene);

        // Handle game loop
        const handleTick = (dt) => {
            app.stage.children.forEach(child => {
                if (child.update) child.update(dt);
            });
        };
        app.ticker.add(handleTick);

        /** @type {HTMLDivElement} */
        const div = ref.current;
        div.replaceWith(app.view);

    }

    useEffect(() => {
        // Init Socket.io
        const socket = io('localhost:8888');
        socket.on('connect', () => {
            initGame(socket);
            socket.on('sync_world', (world) => {
                console.log(world);
            });
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