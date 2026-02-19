// ============================================================
//  main.ts — THE ENTRY POINT (where it all begins!)
// ============================================================
//
//  GAME DEV CONCEPT: The Game Configuration
//  -------------------------------------------
//  Every Phaser game starts with a configuration object that tells
//  the engine:
//    - type: How to render (WebGL or Canvas)
//    - width/height: Size of the game world in pixels
//    - physics: Which physics engine + settings (gravity, etc.)
//    - scene: Array of scenes in load order
//    - parent: Which HTML element to inject the <canvas> into
//    - pixelArt: If true, disables anti-aliasing (keeps pixels sharp)
//
//  Creating `new Phaser.Game(config)` kicks everything off:
//    1. Creates a <canvas> element
//    2. Starts the game loop (update → render → repeat)
//    3. Loads the first scene (BootScene)
//
//  That's it! One object, one `new`, and you have a game.
// ============================================================

import Phaser from 'phaser';
import { WORLD } from './utils/Constants';
import { BootScene } from './scenes/BootScene';
import { MenuScene } from './scenes/MenuScene';
import { GameScene } from './scenes/GameScene';

// --- The game configuration ---
const config: Phaser.Types.Core.GameConfig = {
  // --- Rendering ---
  type: Phaser.AUTO,
  //  AUTO means: use WebGL if the browser supports it (fast, GPU-accelerated),
  //  otherwise fall back to Canvas2D (slower but universal).
  //  For a 2D platformer, both work fine.

  // --- Canvas size ---
  width: WORLD.WIDTH,       // 960 pixels
  height: WORLD.HEIGHT,     // 640 pixels
  parent: 'game-container', // ID of the <div> in index.html

  // --- Pixel art mode ---
  pixelArt: true,
  //  When true, Phaser uses NEAREST-NEIGHBOR scaling instead of
  //  bilinear interpolation. This keeps pixel art SHARP at any zoom.
  //  Without this, pixel art looks blurry when scaled up.
  //   OFF: 🟫 → 🔳 (blurry edges)
  //    ON: 🟫 → 🟫 (crisp edges)

  // --- Background ---
  backgroundColor: '#0a0a1a',

  // --- Physics engine ---
  physics: {
    default: 'arcade',
    //  Phaser has 3 physics engines:
    //    - Arcade: Simple, fast, axis-aligned rectangles only (PERFECT for platformers)
    //    - Matter.js: Full-featured, supports rotation, complex shapes, joints
    //    - Impact: Alternative simple engine (rarely used)
    //  We use Arcade because it's fast and we don't need rotation physics.

    arcade: {
      gravity: { x: 0, y: 800 },
      //  Gravity is measured in pixels per second².
      //  y: 800 means every object accelerates downward at 800 px/s² each second.
      //  Higher = heavier feel. Lower = floaty feel. 800 is a good starting point.
      //  x: 0 means no sideways gravity (obviously).

      debug: false,
      //  When true, shows collision boxes as colored outlines.
      //  EXTREMELY useful during development! Turn it on if something
      //  "feels wrong" — you'll often find the hitbox is misaligned.
      //  Set to false for "production" feel.
    }
  },

  // --- Scenes ---
  scene: [BootScene, MenuScene, GameScene],
  //  Scenes are loaded in this order. The FIRST scene (BootScene)
  //  starts automatically. Each scene transitions to the next
  //  using this.scene.start('SceneName').

  // --- Input ---
  input: {
    keyboard: true,
    touch: true,    // Enable multi-touch for mobile controls
  },

  // --- Scaling ---
  scale: {
    mode: Phaser.Scale.FIT,
    //  FIT means: scale the canvas to fit the browser window while
    //  maintaining aspect ratio. All content visible, no cropping.
    autoCenter: Phaser.Scale.CENTER_BOTH,
    //  Center the canvas horizontally and vertically in the page.
  },
};

// ============================================================
//  🚀 CREATE THE GAME!
// ============================================================
//  This single line:
//    1. Creates a <canvas> in '#game-container'
//    2. Starts the game loop (~60fps)
//    3. Initializes BootScene (which generates textures)
//    4. And the adventure begins...
// ============================================================
new Phaser.Game(config);
