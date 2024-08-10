# Popoo - Real-Time Multiplayer Game

**Popoo** is an engaging real-time multiplayer game where players can connect to a server and compete in a dynamic battle arena. The game is built using Socket.IO for seamless real-time communication, PixiJS for rich, interactive graphics, and Matter.js for physics-based interactions. In the arena, players can move, attack, and outmaneuver their opponents in a fast-paced environment. The gameplay is enhanced by the use of Matter.js, which adds a layer of interaction without focusing on realistic physics. The primary objective is to outlast other players by strategically utilizing attacks, skillfully avoiding damage, and taking advantage of the unique interactions within the game. With its emphasis on quick thinking, tactical maneuvering, and engaging gameplay.

![ScreenShot](https://github.com/boylin0/popoo/blob/main/screenshots_1.gif?raw=true)

## Features

- **Real-Time Multiplayer**: Connect and play with others in real-time using `Socket.IO`.
- **Physics Engine**: Powered by `MatterJS` for realistic movement and collision detection.
- **Authoritative Game Server**: The server handles game logic and ensures fair gameplay.
- **Interactive Graphics**: Powered by `PixiJS` for smooth and responsive 2D rendering.
- **Fast Build**: Using `SWC` with `Webpack` for efficient code bundling and quick development iterations.
- **Attack System**: Players can engage in combat, attacking each other in a fast-paced environment.

## Getting Started

### Prerequisites

- Node.js (v20 or later)

### Quick Start

1. Clone the repository:

    ```bash
    git clone https://github.com/boylin0/popoo.git
    cd popoo
    ```

2. Install dependencies:

    ```bash
    npm install
    ```

3. Start the development server:

    ```bash
    npm run dev
    ```

   This will start the server and open the game in your default browser.

### Build for Production

To build the project for production, run:

```bash
npm run build
```

This will create a `dist` folder with the bundled assets and optimized code.

To start the production server, run:

```bash
npm start
```

## Technologies Used

* Socket.IO: Handles real-time communication between clients and the server.
* PixiJS: A 2D rendering engine for creating interactive graphics and animations.
* MatterJS: A 2D physics engine for handling collisions and movement.
* SWC: A fast TypeScript/JavaScript compiler used for code transpilation.
* Webpack: Bundles the application, allowing for modular code and optimized assets.

## References

- [Client-Server Game Architecture](https://www.gabrielgambetta.com/client-server-game-architecture.html)

## Contact

For any questions or feedback, feel free to reach out to the project maintainer [boylin0](https://github.com/boylin0).

Project Link: https://github.com/boylin0/popoo
