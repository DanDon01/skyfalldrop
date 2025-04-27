# Project Progress Checklist

## Core Setup
- [x] Initialize project (`npm create vite@latest`, choose Vanilla JS)
- [x] Install Three.js (`npm install three`)
- [x] Basic HTML structure (`public/index.html`)
- [x] Main JavaScript entry point (`public/main.js`)
- [x] Basic scene, camera, renderer setup
- [x] Animation loop (`requestAnimationFrame`)

## Player
- [x] Create player module (`public/player.js`)
- [x] Add player representation (Sprite/Plane) to scene
- [x] Load player texture
- [x] Implement basic player movement controls (Keyboard/Touch)
  - Keyboard: Left/Right/Up/Down (Vertical limited range)
  - Touch: Direct drag (Horizontal/Vertical limited range)
- [x] Add gravity/falling simulation
- [x] Implement screen boundaries for player movement
- [x] Player stops falling visually at screen center, background scrolls

## Background & Environment
- [x] Create scrolling background (`public/background.js`)
- [x] Load background textures/elements
- [x] Implement texture scrolling based on player fall speed
- [x] Add dynamic background color tinting overlay
- [ ] Implement parallax scrolling effect
- [ ] Add environmental elements (e.g., clouds, wind particles)

## Obstacles
- [x] Design obstacle types (e.g., static, moving, destructible)
- [x] Create obstacle module (`public/obstacle.js`)
- [x] Implement obstacle generation/spawning logic (`public/obstacleManager.js`)
- [x] Add collision detection (Player vs. Obstacles)

## Gameplay Mechanics
- [x] Scoring system
- [ ] Portal exit system (after reaching score threshold)
- [ ] Difficulty progression (e.g., faster scrolling, more obstacles)
- [ ] VibeShot snapshot mode

## UI/UX
- [x] Display score
- [ ] Portal indicator
- [ ] Touch control indicators (optional)
- [ ] VibeShot button

## Audio
- [ ] Add background music
- [ ] Add sound effects (collision, score, etc.)

## Portal Exit System
- [ ] Create portal module (`public/portal.js`)
- [ ] Implement portal appearance at score threshold
- [ ] Add portal visual effects
- [ ] Handle player entering portal
- [ ] Implement transition to destination URL

## VibeShot Feature
- [ ] Create snapshot module (`public/snapshot.js`) 
- [ ] Implement slow-motion and camera adjustment
- [ ] Add score overlay for screenshots
- [ ] Include watermark with branding
- [ ] Allow players to save/share screenshots

## Refinement & Polish
- [ ] Code cleanup and optimization
- [ ] Cross-browser testing
- [ ] Performance monitoring
- [ ] Bug fixing

## Advanced Features
- [ ] Day/Night cycle based on play duration
- [ ] Player trail effects
- [ ] Dynamic weather layers
- [ ] Seasonal themes

## Scoring & UI
- [ ] Create ScoreManager (`src/score.js`)
- [ ] Increment score based on time/distance
- [ ] Display score on HTML UI (`src/ui.js`)
- [ ] Add milestone indicators/sounds
- [ ] Display game over message

## Game State & Flow
- [ ] Manage game states (Loading, Playing, Game Over) (`src/gameState.js`)
- [ ] Implement game start logic

## Build & Deployment
- [ ] Setup build process (e.g., Vite, Webpack)
- [ ] Create production build
- [ ] Deploy to hosting platform
