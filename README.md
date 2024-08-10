# Popoo - Real-Time Multiplayer Game

**Popoo** is a real-time multiplayer game where players can connect and battle against each other. The game is built using `Socket.IO` for real-time communication and `PixiJS` for interactive graphics. Players can move, attack, and outmaneuver opponents in a fast-paced environment.

In Popoo, players connect to a server and enter a battle arena where they can move, attack, and outmaneuver opponents. The goal is to outlast other players by strategically using attacks and avoiding damage.

![ScreenShot](https://github.com/boylin0/popoo/blob/main/screenshots_1.gif?raw=true)

## Features

- **Real-Time Multiplayer**: Connect and play with others in real-time using `Socket.IO`.
- **Interactive Graphics**: Powered by `PixiJS` for smooth and responsive 2D rendering.
- **Fast Build**: Using `SWC` with `Webpack` for efficient code bundling and quick development iterations.
- **Attack System**: Players can engage in combat, attacking each other in a fast-paced environment.

## Getting Started

### Prerequisites

- Node.js (v20 or later)

### Installation

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

### Technologies Used

* Socket.IO: Handles real-time communication between clients and the server.
* PixiJS: A 2D rendering engine for creating interactive graphics and animations.
* MatterJS: A 2D physics engine for handling collisions and movement.
* SWC: A fast TypeScript/JavaScript compiler used for code transpilation.
* Webpack: Bundles the application, allowing for modular code and optimized assets.

### Contact

For any questions or feedback, feel free to reach out to the project maintainer [boylin0](https://github.com/boylin0).

Project Link: https://github.com/boylin0/popoo
