# Universe of X

**Universe of X** is a 3D interactive galaxy visualization powered by Three.js. Each solar system represents a user, and their data determines celestial attributes like planet size, orbit, and hierarchy. The largest user is the sun, with planets and moons representing follower counts and connections.

## Features

- Real-time rendering of stars, planets, and moons
- Scaled orbits and elevations based on user metrics
- Focus zoom to explore individual solar systems
- Postprocessing with bloom and HDR for visual depth
- Dynamic data loading from JSON backend

## Tech Stack

- **Three.js** for 3D rendering
- **OrbitControls** for camera navigation
- **UnrealBloomPass** and **RGBELoader** for effects
- **Node.js** for backend data generation (optional)
- **JSON** format for user system seed data

## Running Locally

```bash
git clone https://github.com/matthewfornear/universeofx.git
cd universeofx
npm install
npm run dev
