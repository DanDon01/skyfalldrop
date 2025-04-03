# Required Game Assets (Three.js Version)
*Note: This file should be kept up-to-date with changes.*

This file lists the assets needed for the 3D version of Skyfall Drop. Place files in specified directories.

## Models & Textures (`public/models/`, `public/textures/`)

*   **Player:**
    *   Option A: 3D Model (`player.glb` or `player.gltf` in `/models/`). Needs appropriate textures included or separate (e.g., `player_texture.png` in `/textures/`).
    *   Option B: Sprite on a 3D Plane (`player.png` in `/textures/`). Needs transparency.
*   **Obstacles:**
    *   Option A: 3D Models (`bird_pigeon.glb`, `plane_jet.glb`, etc. in `/models/`).
    *   Option B: Sprites on 3D Planes (`bird_pigeon.png`, `plane_jet.png`, etc. in `/textures/`). Need transparency.
*   **Background:**
    *   Option A: Skybox Textures (Set of 6 images: `skybox_px.png`, `skybox_nx.png`, `skybox_py.png`, `skybox_ny.png`, `skybox_pz.png`, `skybox_nz.png` in `/textures/skybox/`). Should represent a clear blue sky.
    *   Option B: Skydome Texture (`skydome.png` in `/textures/`). A single panoramic sky texture.
*   **Clouds:**
    *   `cloud_billboard.png` (in `/textures/`). A texture for cloud particles/billboards. Needs transparency. Multiple variations could be used.
*   **Portal:**
    *   Likely generated primarily via code (using the provided Three.js snippet). May potentially use textures for effects (e.g., `portal_effect.png` in `/textures/`) if needed by shaders.
*   **UI/FX:**
    *   `milestone_flash_1k.png` (etc. in `/textures/`). These might be used for HTML overlay UI instead of in-world 3D objects. Needs transparency.
    *   `logo.png` (in `/textures/`). For HTML overlay UI/watermark. Needs transparency.

## Audio (`public/audio/`) - Recommended formats: MP3 (music), WAV/OGG (SFX)

*   **Music:**
    *   `background_loop.mp3` (or `.ogg`) (Should loop seamlessly)
*   **Sound Effects (SFX):**
    *   `sfx_whoosh_fall.wav` (or `.mp3`, `.ogg`) (Optional falling sound)
    *   `sfx_hit_bounce.wav` (Short impact/bounce sound)
    *   `sfx_milestone_ping.wav` (Short notification sound)
    *   `sfx_portal_warp.wav` (Warping/transition sound)
    *   `sfx_snapshot_click.wav` (Camera click sound)
    *   `sfx_snapshot_slowmo.wav` (Slow-motion entry/exit sound)

## Fonts

*   Consider adding font files (e.g., `.ttf`, `.woff2`) to a `/public/fonts/` directory if using custom web fonts not loaded via CSS `@import`. The masterplan mentions Orbitron, Inter, or LCD style.
*   **Wind Particles:**
    *   `wind_particle.png` (in `/textures/`). Small, possibly streaky or hazy texture for wind effect. Needs transparency.
