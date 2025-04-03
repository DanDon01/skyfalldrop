# Skyfall Drop - Development Progress (PIVOT TO THREE.JS)
*Note: This file should be kept up-to-date with changes.*

**Goal:** Refactor the game to use Three.js for a 3D free-falling experience (player static vertically, world moves up), maintaining core mechanics.

## Initial Setup
- [x] Read `README-masterplan`.
- [x] Create `progress.md`.
- [x] Review and adjust initial file structure.
- [x] **Install Three.js dependency.**
- [x] **Update `required_assets.md` for 3D.**

## Core Feature Refactoring (3D)
- [x] **Setup Three.js Scene:** (main.js: Scene, Camera, Renderer, Lighting, Loop, Clock)
- [ ] **Player:** (player.js: Keep player vertically centered, adapt movement)
- [ ] **Obstacles:** (obstacles.js: Spawn low, move up, add horizontal movement for some types)
- [ ] **Background:** (background.js: Refactor clouds for upward movement, add distinct layers)
- [x] **Controls:** (controls.js, controls-touch.js: Existing logic compatible with basic 3D movement)
- [ ] **Collision Detection:** (main.js: Re-verify with new movement)
- [ ] **Collision Response:** (player.js, score.js: Adapt bounce/flash/score reduction)
- [ ] **Score:** (score.js: Increase update frequency)
- [x] **Portal:** (main.js: Integrated provided Three.js portal code - creation, animation, collision checks)
- [x] **Snapshot:** (snapshot.js: Adapted for 3D context, integrated slow-mo timing, basic WebGL capture placeholder)
- [x] **UI:** (ui.js: Refactored for HTML overlay. main.js: Integrated HTML UI updates)
- [x] **Asset Loading:** (assets.js: Refactored for Three.js loaders & LoadingManager. main.js: Integrated LoadingManager flow & component asset passing. Corrected loadAll.)
- [x] **Wind Particles:** (wind-particles.js: Created and integrated upward moving particles)

## Asset Integration (3D - Placeholders)
- [x] Player Model/Texture (Texture applied to basic plane)
- [x] Obstacle Models/Textures (Textures applied to planes/boxes)
- [x] Skybox Textures / Cloud Textures (Basic gradient sky + layered cloud particles implemented)
- [x] Portal Assets (Code-generated portals implemented)
- [x] Milestone FX (HTML UI message implemented)
- [x] Background Music Loop (Loading and playback implemented)
- [x] Sound Effects (Loading and playback implemented)
- [x] Font Integration (Handled with HTML UI)
- [x] Wind Particle Texture (Added to required_assets.md, loaded in assets.js)

## UI Implementation (3D)
- [x] Score Display (HTML Overlay)
- [x] Milestone Messages (HTML Overlay)
- [x] Snapshot Button (HTML Overlay)

## Polish & Refinement (3D)
- [ ] Visual Feedback (3D effects for collisions/milestones)
- [ ] Player Trail Logic (3D trail effect - needs refactoring)
- [ ] Input Responsiveness Tuning
- [ ] Performance Optimization (WebGL specific)

## Launch Checklist (Re-evaluate after refactor)
- [ ] Mobile-first canvas confirmed
- [ ] Touch + keyboard controls confirmed
- [ ] 3D visual style confirmed
- [ ] Background music + SFX confirmed
- [ ] Score counter + milestones confirmed
- [ ] Object collisions confirmed
- [ ] Snapshot mode confirmed
- [ ] Portal trigger/functionality confirmed
- [ ] Lightweight & fast loading confirmed
- [ ] Deployment (Placeholder - skyfalldrop.com)

## Stretch Goals (Post-MVP)
- [ ] Trail styles unlocked by score
- [ ] Day/Night sky shift
- [ ] Dynamic weather layers
- [ ] Global/local leaderboard
- [ ] Random daily sky seeds
