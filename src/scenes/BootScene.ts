// ============================================================
//  BootScene.ts — Loads all game assets before anything else
// ============================================================
//
//  GAME DEV CONCEPT: The Boot / Preload Scene
//  --------------------------------------------
//  Games need to load assets (images, sounds, maps) BEFORE they
//  can be used. This takes time — especially on slow connections.
//
//  The Boot scene:
//    1. Loads real art assets (sprites, tiles, backgrounds, music)
//    2. Generates procedural fallbacks for anything not yet available
//    3. Creates Phaser animations from loaded sprite frames
//    4. Shows a loading progress bar
//    5. Transitions to the Menu scene when everything's ready
// ============================================================

import Phaser from 'phaser';
import { WORLD } from '../utils/Constants';
import { generateTextures } from '../utils/TextureGenerator';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  // ========================================================
  //  preload() — Load all real assets here
  // ========================================================
  preload(): void {
    this.createLoadingBar();

    // =======================================================
    //  CHARACTER SPRITES — Individual frames for each animation
    // =======================================================
    //  Our side-scroller uses the "east" direction for facing right.
    //  Phaser will flip the sprite horizontally when facing left.

    // Idle (breathing) — 4 frames
    for (let i = 0; i < 4; i++) {
      this.load.image(
        `player-idle-${i}`,
        `assets/character/animations/breathing-idle/east/frame_00${i}.png`
      );
    }

    // Run — 4 frames
    for (let i = 0; i < 4; i++) {
      this.load.image(
        `player-run-${i}`,
        `assets/character/animations/running-4-frames/east/frame_00${i}.png`
      );
    }

    // Jump — 9 frames (we'll use key frames: 0=crouch, 2=launch, 4=peak, 6=fall, 8=land)
    for (let i = 0; i < 9; i++) {
      this.load.image(
        `player-jump-${i}`,
        `assets/character/animations/jumping-1/east/frame_00${i}.png`
      );
    }

    // Static player sprite (used for dimension manager reference, fallback)
    this.load.image('player-static', 'assets/character/rotations/east.png');

    // =======================================================
    //  ENEMY SPRITES
    // =======================================================

    // Lumina patrol enemy — static + run animation
    this.load.image('enemy-patrol-static', 'assets/enemies/lumina/rotations/east.png');
    for (let i = 0; i < 4; i++) {
      this.load.image(
        `enemy-patrol-run-${i}`,
        `assets/enemies/lumina/animations/running-4-frames/east/frame_00${i}.png`
      );
    }

    // =======================================================
    //  TILES
    // =======================================================
    this.load.image('tile-lumina-ground', 'assets/tiles/ground/lumina.jpg');
    this.load.image('tile-lumina-platform', 'assets/tiles/platform/lumina.png');
    this.load.image('tile-lumina-wall', 'assets/tiles/wall/lumina.jpg');
    this.load.image('tile-umbra-ground', 'assets/tiles/ground/umbra.jpg');
    this.load.image('tile-umbra-platform', 'assets/tiles/platform/umbra.png');
    this.load.image('tile-umbra-wall', 'assets/tiles/wall/umbra.jpg');

    // =======================================================
    //  BACKGROUNDS
    // =======================================================
    this.load.image('bg-lumina', 'assets/bg/lumina.png');
    this.load.image('bg-umbra', 'assets/bg/umbra.png');

    // =======================================================
    //  MUSIC
    // =======================================================
    this.load.audio('bgm-lumina', 'assets/music/lumina.mp3');
    this.load.audio('bgm-umbra', 'assets/music/umbra.mp3');
  }

  // ========================================================
  //  create() — Called once preload is done
  // ========================================================
  create(): void {
    // Generate procedural textures for assets not yet available
    // (portal, particles, spikes, umbra enemy, tileset composites)
    generateTextures(this);

    // Create Phaser animations from the loaded frames
    this.createAnimations();

    // Brief delay so the user sees the "loaded" message
    this.time.delayedCall(400, () => {
      this.scene.start('MenuScene');
    });
  }

  // ========================================================
  //  createAnimations() — Register sprite animations
  // ========================================================
  private createAnimations(): void {
    // --- Player Idle ---
    this.anims.create({
      key: 'player-idle',
      frames: [
        { key: 'player-idle-0' },
        { key: 'player-idle-1' },
        { key: 'player-idle-2' },
        { key: 'player-idle-3' },
      ],
      frameRate: 6,
      repeat: -1,
    });

    // --- Player Run ---
    this.anims.create({
      key: 'player-run',
      frames: [
        { key: 'player-run-0' },
        { key: 'player-run-1' },
        { key: 'player-run-2' },
        { key: 'player-run-3' },
      ],
      frameRate: 10,
      repeat: -1,
    });

    // --- Player Jump (ascending — first 5 frames) ---
    this.anims.create({
      key: 'player-jump',
      frames: [
        { key: 'player-jump-0' },
        { key: 'player-jump-1' },
        { key: 'player-jump-2' },
        { key: 'player-jump-3' },
        { key: 'player-jump-4' },
      ],
      frameRate: 12,
      repeat: 0,
    });

    // --- Player Fall (descending — last 4 frames) ---
    this.anims.create({
      key: 'player-fall',
      frames: [
        { key: 'player-jump-5' },
        { key: 'player-jump-6' },
        { key: 'player-jump-7' },
        { key: 'player-jump-8' },
      ],
      frameRate: 10,
      repeat: 0,
    });

    // --- Enemy Patrol Run ---
    this.anims.create({
      key: 'enemy-patrol-run',
      frames: [
        { key: 'enemy-patrol-run-0' },
        { key: 'enemy-patrol-run-1' },
        { key: 'enemy-patrol-run-2' },
        { key: 'enemy-patrol-run-3' },
      ],
      frameRate: 8,
      repeat: -1,
    });
  }

  // ========================================================
  //  createLoadingBar — Visual feedback during loading
  // ========================================================
  private createLoadingBar(): void {
    const centerX = WORLD.WIDTH / 2;
    const centerY = WORLD.HEIGHT / 2;

    // Title
    this.add.text(centerX, centerY - 60, 'SHIFT', {
      fontSize: '48px',
      fontFamily: 'monospace',
      color: '#44ddff',
    }).setOrigin(0.5);

    // "Loading" text
    const loadText = this.add.text(centerX, centerY + 10, 'Loading assets...', {
      fontSize: '16px',
      fontFamily: 'monospace',
      color: '#888888',
    }).setOrigin(0.5);

    // Progress bar background
    const barBg = this.add.graphics();
    barBg.fillStyle(0x222222);
    barBg.fillRect(centerX - 150, centerY + 40, 300, 20);

    // Progress bar fill
    const barFill = this.add.graphics();

    // Phaser emits 'progress' events during loading (0 to 1)
    this.load.on('progress', (value: number) => {
      barFill.clear();
      barFill.fillStyle(0x44ddff);
      barFill.fillRect(centerX - 148, centerY + 42, 296 * value, 16);
    });

    this.load.on('complete', () => {
      loadText.setText('Ready!');
      barFill.clear();
      barFill.fillStyle(0x44ffaa);
      barFill.fillRect(centerX - 148, centerY + 42, 296, 16);
    });
  }
}
