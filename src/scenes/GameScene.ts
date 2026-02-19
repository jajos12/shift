// ============================================================
//  GameScene.ts — The main gameplay scene (WHERE THE FUN IS!)
// ============================================================
//
//  GAME DEV CONCEPT: Scene as Orchestrator
//  -----------------------------------------
//  The GameScene doesn't DO the game logic itself. It ORCHESTRATES
//  other systems: Player handles movement, DimensionManager handles
//  shifting, ParticleManager handles effects, CameraManager handles
//  the viewport, AudioManager handles sound.
//
//  This is "composition" — each system is independent and testable.
//  GameScene is the conductor, not the orchestra.
// ============================================================

import Phaser from 'phaser';
import { WORLD, DIMENSIONS, COLORS } from '../utils/Constants';
import { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';
import { PatrolEnemy } from '../entities/enemies/PatrolEnemy';
import { ChaseEnemy } from '../entities/enemies/ChaseEnemy';
import { DimensionManager } from '../systems/DimensionManager';
import { ParallaxBackground } from '../systems/ParallaxBackground';
import { ParticleManager } from '../systems/ParticleManager';
import { CameraManager } from '../systems/CameraManager';
import { AudioManager } from '../systems/AudioManager';
import { TouchControls } from '../systems/TouchControls';
import { ALL_LEVELS, type LevelDefinition } from '../levels/LevelData';

export class GameScene extends Phaser.Scene {
  // --- Core objects ---
  private player!: Player;
  private dimensionManager!: DimensionManager;

  // --- New systems ---
  private parallax!: ParallaxBackground;
  private particles!: ParticleManager;
  private cameraManager!: CameraManager;
  private audioManager!: AudioManager;

  // --- Tilemap layers ---
  private luminaLayer!: Phaser.Tilemaps.TilemapLayer;
  private umbraLayer!: Phaser.Tilemaps.TilemapLayer;

  // --- Physics colliders ---
  private activeCollider?: Phaser.Physics.Arcade.Collider;
  private enemyCollider?: Phaser.Physics.Arcade.Collider;

  // --- Enemies ---
  private enemies: Enemy[] = [];

  // --- Level tracking ---
  private currentLevelIndex: number = 0;
  private currentLevel!: LevelDefinition;

  // --- Exit portal ---
  private exitPortal!: Phaser.GameObjects.Sprite;

  // --- Ambient particles ---
  private ambientEmitter?: Phaser.GameObjects.Particles.ParticleEmitter;

  // --- HUD elements ---
  private healthIcons: Phaser.GameObjects.Graphics[] = [];
  private dimensionText!: Phaser.GameObjects.Text;
  private levelNameText!: Phaser.GameObjects.Text;

  // --- Player state tracking for particles ---
  private wasInAir: boolean = false;
  private jumpParticleTimer: number = 0;
  private levelComplete: boolean = false;

  // --- Background Music ---
  private bgm?: Phaser.Sound.BaseSound;

  // --- Touch controls (mobile) ---
  private touchControls!: TouchControls;

  constructor() {
    super('GameScene');
  }

  // ========================================================
  //  init() — Receives data from the previous scene
  // ========================================================
  init(data: { levelIndex?: number }): void {
    this.currentLevelIndex = data.levelIndex ?? 0;
    this.currentLevel = ALL_LEVELS[this.currentLevelIndex];
    this.levelComplete = false;

    // Reset arrays that would otherwise carry stale refs from previous level
    this.enemies = [];
    this.healthIcons = [];
  }

  // ========================================================
  //  create() — Build the world! Called once.
  // ========================================================
  create(): void {
    // --- Initialize audio manager (shared across levels) ---
    this.audioManager = new AudioManager();

    // --- Parallax background (behind everything) ---
    this.parallax = new ParallaxBackground(this);

    // --- Build the tilemap from level data ---
    this.createTilemap();

    // --- Create the dimension manager ---
    this.dimensionManager = new DimensionManager(this);
    this.dimensionManager.init(
      this.luminaLayer,
      this.umbraLayer,
      () => this.onDimensionShift()
    );

    // --- Create the player ---
    const startX = this.currentLevel.playerStart.x * WORLD.TILE_SIZE + WORLD.TILE_SIZE / 2;
    const startY = this.currentLevel.playerStart.y * WORLD.TILE_SIZE + WORLD.TILE_SIZE / 2;
    this.player = new Player(this, startX, startY);
    this.player.setDimensionManager(this.dimensionManager);

    // --- Touch controls (auto-detects mobile) ---
    this.touchControls = new TouchControls(this);
    this.player.setTouchControls(this.touchControls);

    // --- Create exit portal with particle effect ---
    const exitX = this.currentLevel.exit.x * WORLD.TILE_SIZE + WORLD.TILE_SIZE / 2;
    const exitY = this.currentLevel.exit.y * WORLD.TILE_SIZE + WORLD.TILE_SIZE / 2;
    this.exitPortal = this.add.sprite(exitX, exitY, 'exit-portal');
    this.exitPortal.setDepth(5);

    // Pulsing animation on the exit portal
    this.tweens.add({
      targets: this.exitPortal,
      scaleX: { from: 0.9, to: 1.2 },
      scaleY: { from: 0.9, to: 1.2 },
      alpha: { from: 0.6, to: 1.0 },
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
    });

    // --- Particle systems ---
    this.particles = new ParticleManager(this);
    this.particles.createPortalEmitter(exitX, exitY);

    // Create dimension-aware ambient particles
    this.ambientEmitter = this.particles.createAmbientEmitter(DIMENSIONS.LUMINA);

    // --- Camera system ---
    this.cameraManager = new CameraManager(this);
    this.cameraManager.init(this.player);

    // --- Set up physics collision ---
    this.rebuildCollider();

    // --- Spawn enemies from level data ---
    this.spawnEnemies();

    // --- Create HUD ---
    this.createHUD();

    // --- Show level name briefly ---
    this.showLevelIntro();

    // --- Start ambient audio ---
    this.audioManager.startAmbient(DIMENSIONS.LUMINA);

    // --- Start background music ---
    this.startBGM(DIMENSIONS.LUMINA);

    // --- Listen for player death (remove old listeners first to prevent duplication) ---
    this.events.off('player-died');
    this.events.on('player-died', () => this.handlePlayerDeath());

    // --- Pause on ESC ---
    this.input.keyboard?.on('keydown-ESC', () => this.togglePause());

    // --- Restart level on R ---
    this.input.keyboard?.on('keydown-R', () => this.restartLevel());

    // --- Track ground state for particles ---
    this.wasInAir = false;
  }

  // ========================================================
  //  update() — Runs EVERY FRAME (~60fps)
  // ========================================================
  update(time: number, delta: number): void {
    if (this.levelComplete) return;

    // Update the player (handles all input + movement)
    this.player.update(time, delta);

    // Update HUD
    this.updateHUD();

    // Check if player reached the exit
    this.checkExit();

    // Update background color based on dimension
    this.updateBackgroundColor();

    // --- Particle effects based on player state ---
    this.updatePlayerParticles(delta);

    // --- Update enemy AI ---
    for (const enemy of this.enemies) {
      enemy.updateAI(this.player.x, this.player.y, delta);
    }
  }

  // ========================================================
  //  updatePlayerParticles — Trigger particles on events
  // ========================================================
  private updatePlayerParticles(delta: number): void {
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    if (!body) return;

    const onGround = body.blocked.down;

    // Landing dust — player just hit the ground
    if (onGround && this.wasInAir) {
      this.particles.emitLandingDust(this.player.x, this.player.y + 14);
      this.audioManager.playLand();
    }

    // Jump trail — emit particles while airborne
    if (!onGround) {
      this.jumpParticleTimer += delta;
      if (this.jumpParticleTimer > 80) { // Every 80ms
        this.particles.emitJumpParticle(this.player.x, this.player.y);
        this.jumpParticleTimer = 0;
      }
    } else {
      this.jumpParticleTimer = 0;
    }

    // Track previous state
    this.wasInAir = !onGround;
  }

  // ========================================================
  //  onDimensionShift — Called by DimensionManager after shift
  // ========================================================
  private onDimensionShift(): void {
    // Rebuild physics collider for new active layer
    this.rebuildCollider();

    const dim = this.dimensionManager.getCurrent();
    const isLumina = dim === DIMENSIONS.LUMINA;

    // Camera effects
    this.cameraManager.playShiftEffect(isLumina);

    // Particle burst at player position
    this.particles.emitShiftBurst(this.player.x, this.player.y, dim);

    // Audio
    this.audioManager.playShift(isLumina);
    this.audioManager.crossfadeAmbient(dim);
    this.crossfadeBGM(dim);

    // Update parallax background colors
    this.parallax.onDimensionShift(dim);

    // Swap ambient particles
    if (this.ambientEmitter) {
      this.ambientEmitter.destroy();
    }
    this.ambientEmitter = this.particles.createAmbientEmitter(dim);

    // Update enemies' active/ghost state
    for (const enemy of this.enemies) {
      enemy.onDimensionShift(dim);
    }

    // Rebuild enemy collider (only active enemies should collide)
    this.rebuildEnemyCollider();
  }

  // ========================================================
  //  createTilemap() — Build the level from 2D number arrays
  // ========================================================
  private createTilemap(): void {
    const ts = WORLD.TILE_SIZE;
    const level = this.currentLevel;

    const mapData = new Phaser.Tilemaps.MapData({
      width: WORLD.TILES_X,
      height: WORLD.TILES_Y,
      tileWidth: ts,
      tileHeight: ts,
      orientation: Phaser.Tilemaps.Orientation.ORTHOGONAL,
      format: Phaser.Tilemaps.Formats.ARRAY_2D,
    });

    const tilemap = new Phaser.Tilemaps.Tilemap(this, mapData);

    const luminaTileset = tilemap.addTilesetImage('tileset-lumina', 'tileset-lumina', ts, ts, 0, 0, 1);
    const umbraTileset = tilemap.addTilesetImage('tileset-umbra', 'tileset-umbra', ts, ts, 0, 0, 1);

    if (!luminaTileset || !umbraTileset) {
      console.error('Failed to load tilesets!');
      return;
    }

    // --- Create Lumina layer ---
    const luminaLayerObj = tilemap.createBlankLayer('lumina', luminaTileset, 0, 0, WORLD.TILES_X, WORLD.TILES_Y, ts, ts);
    if (!luminaLayerObj) { console.error('Failed to create Lumina layer!'); return; }
    this.luminaLayer = luminaLayerObj;

    for (let row = 0; row < level.lumina.length; row++) {
      for (let col = 0; col < level.lumina[row].length; col++) {
        const tileIndex = level.lumina[row][col];
        if (tileIndex > 0) {
          this.luminaLayer.putTileAt(tileIndex, col, row);
        }
      }
    }

    // --- Create Umbra layer ---
    const umbraLayerObj = tilemap.createBlankLayer('umbra', umbraTileset, 0, 0, WORLD.TILES_X, WORLD.TILES_Y, ts, ts);
    if (!umbraLayerObj) { console.error('Failed to create Umbra layer!'); return; }
    this.umbraLayer = umbraLayerObj;

    for (let row = 0; row < level.umbra.length; row++) {
      for (let col = 0; col < level.umbra[row].length; col++) {
        const tileIndex = level.umbra[row][col];
        if (tileIndex > 0) {
          this.umbraLayer.putTileAt(tileIndex, col, row);
        }
      }
    }
  }

  // ========================================================
  //  rebuildCollider() — Update physics for active dimension
  // ========================================================
  private rebuildCollider(): void {
    if (this.activeCollider) {
      this.activeCollider.destroy();
    }
    const activeLayer = this.dimensionManager.getActiveLayer();
    this.activeCollider = this.physics.add.collider(this.player, activeLayer);
  }

  // ========================================================
  //  spawnEnemies() — Create enemies from level data
  // ========================================================
  private spawnEnemies(): void {
    const level = this.currentLevel;
    if (!level.enemies) return;

    const ts = WORLD.TILE_SIZE;

    for (const spawn of level.enemies) {
      const px = spawn.x * ts + ts / 2;
      const py = spawn.y * ts + ts / 2;
      let enemy: Enemy;

      if (spawn.type === 'patrol') {
        enemy = new PatrolEnemy(this, px, py, spawn.patrolRange ?? 100);
      } else {
        enemy = new ChaseEnemy(this, px, py, spawn.detectionRange ?? 150);
      }

      this.enemies.push(enemy);

      // Enemies collide with the active layer (so they stand on platforms)
      const activeLayer = this.dimensionManager.getActiveLayer();
      this.physics.add.collider(enemy, activeLayer);
    }

    // Set up initial enemy-player overlap
    this.rebuildEnemyCollider();

    // Set initial dimension state for enemies
    const dim = this.dimensionManager.getCurrent();
    for (const enemy of this.enemies) {
      enemy.onDimensionShift(dim);
    }
  }

  // ========================================================
  //  rebuildEnemyCollider — Enemy-player overlap detection
  // ========================================================
  private rebuildEnemyCollider(): void {
    if (this.enemyCollider) {
      this.enemyCollider.destroy();
    }

    // Use overlap (not collider) — enemies don't push the player,
    // they just damage on contact
    this.enemyCollider = this.physics.add.overlap(
      this.player,
      this.enemies,
      (_player, enemyObj) => {
        const enemy = enemyObj as Enemy;
        if (enemy.canDamage()) {
          this.player.takeDamage(enemy.getDamage());
          this.cameraManager.playDamageEffect();
          this.audioManager.playDamage();
        }
      }
    ) as unknown as Phaser.Physics.Arcade.Collider;
  }

  // ========================================================
  //  checkExit() — Did the player reach the exit portal?
  // ========================================================
  private checkExit(): void {
    const dist = Phaser.Math.Distance.Between(
      this.player.x, this.player.y,
      this.exitPortal.x, this.exitPortal.y
    );

    if (dist < 24) {
      this.completeLevel();
    }
  }

  // ========================================================
  //  completeLevel() — Level beaten!
  // ========================================================
  private completeLevel(): void {
    if (this.levelComplete) return;
    this.levelComplete = true;

    // Audio celebration
    this.audioManager.playExitChime();
    this.audioManager.stopAmbient();
    this.stopBGM();

    const nextIndex = this.currentLevelIndex + 1;

    if (nextIndex < ALL_LEVELS.length) {
      this.cameraManager.playLevelCompleteEffect();
      this.time.delayedCall(800, () => {
        this.scene.restart({ levelIndex: nextIndex });
      });
    } else {
      this.showVictory();
    }
  }

  // ========================================================
  //  showVictory() — All levels beaten!
  // ========================================================
  private showVictory(): void {
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0, 0);
    body.setAllowGravity(false);

    // Dark overlay
    this.add.rectangle(
      WORLD.WIDTH / 2, WORLD.HEIGHT / 2,
      WORLD.WIDTH, WORLD.HEIGHT,
      0x000000, 0.7
    ).setDepth(50).setScrollFactor(0);

    // Victory text
    this.add.text(WORLD.WIDTH / 2, WORLD.HEIGHT / 2 - 40, '🎉 YOU WIN! 🎉', {
      fontSize: '48px',
      fontFamily: 'monospace',
      color: '#44ffaa',
    }).setOrigin(0.5).setDepth(51).setScrollFactor(0);

    this.add.text(WORLD.WIDTH / 2, WORLD.HEIGHT / 2 + 20, 'All dimensions conquered!', {
      fontSize: '18px',
      fontFamily: 'monospace',
      color: '#aaaaaa',
    }).setOrigin(0.5).setDepth(51).setScrollFactor(0);

    const restartText = this.add.text(WORLD.WIDTH / 2, WORLD.HEIGHT / 2 + 70, '[ ENTER to play again ]', {
      fontSize: '16px',
      fontFamily: 'monospace',
      color: '#44ddff',
    }).setOrigin(0.5).setDepth(51).setScrollFactor(0);

    this.tweens.add({
      targets: restartText,
      alpha: { from: 1, to: 0 },
      duration: 600,
      yoyo: true,
      repeat: -1,
    });

    this.input.keyboard?.on('keydown-ENTER', () => {
      this.scene.start('MenuScene');
    });
  }

  // ========================================================
  //  createHUD() — Heads-Up Display
  // ========================================================
  private createHUD(): void {
    const hudDepth = 100;

    // --- Health hearts ---
    for (let i = 0; i < this.player.getMaxHealth(); i++) {
      const heart = this.add.graphics();
      heart.setDepth(hudDepth);
      heart.setScrollFactor(0);
      this.healthIcons.push(heart);
    }
    this.drawHearts();

    // --- Dimension indicator ---
    this.dimensionText = this.add.text(WORLD.WIDTH - 16, 16, '', {
      fontSize: '14px',
      fontFamily: 'monospace',
      color: '#ffffff',
    }).setOrigin(1, 0).setDepth(hudDepth).setScrollFactor(0);

    // --- Level name (top center) ---
    this.levelNameText = this.add.text(WORLD.WIDTH / 2, 16, '', {
      fontSize: '12px',
      fontFamily: 'monospace',
      color: '#666666',
    }).setOrigin(0.5, 0).setDepth(hudDepth).setScrollFactor(0);
  }

  // ========================================================
  //  drawHearts() — Render health as heart shapes
  // ========================================================
  private drawHearts(): void {
    const health = this.player.getHealth();
    for (let i = 0; i < this.healthIcons.length; i++) {
      const heart = this.healthIcons[i];
      heart.clear();
      const full = i < health;
      heart.fillStyle(full ? COLORS.HEALTH_FULL : COLORS.HEALTH_EMPTY);
      heart.fillRoundedRect(16 + i * 22, 16, 18, 18, 4);
    }
  }

  // ========================================================
  //  updateHUD() — Called every frame
  // ========================================================
  private updateHUD(): void {
    this.drawHearts();

    const dim = this.dimensionManager.getCurrent();
    const isLumina = dim === DIMENSIONS.LUMINA;
    this.dimensionText.setText(isLumina ? '☀ LUMINA' : '🌙 UMBRA');
    this.dimensionText.setColor(isLumina ? '#ffcc44' : '#8866cc');

    this.levelNameText.setText(`${this.currentLevel.name}`);
  }

  // ========================================================
  //  updateBackgroundColor — Change bg based on dimension
  // ========================================================
  private updateBackgroundColor(): void {
    const dim = this.dimensionManager.getCurrent();
    const bgColor = dim === DIMENSIONS.LUMINA ? COLORS.LUMINA_BG : COLORS.UMBRA_BG;
    this.cameras.main.setBackgroundColor(bgColor);
  }

  // ========================================================
  //  showLevelIntro — Display level name at start
  // ========================================================
  private showLevelIntro(): void {
    const cx = WORLD.WIDTH / 2;
    const cy = WORLD.HEIGHT / 2;

    const nameText = this.add.text(cx, cy - 20, this.currentLevel.name, {
      fontSize: '36px',
      fontFamily: 'monospace',
      color: '#44ddff',
    }).setOrigin(0.5).setDepth(200).setAlpha(0).setScrollFactor(0);

    const subText = this.add.text(cx, cy + 20, this.currentLevel.subtitle, {
      fontSize: '16px',
      fontFamily: 'monospace',
      color: '#666688',
    }).setOrigin(0.5).setDepth(200).setAlpha(0).setScrollFactor(0);

    this.tweens.add({
      targets: [nameText, subText],
      alpha: 1,
      duration: 500,
      hold: 1500,
      yoyo: true,
      onComplete: () => {
        nameText.destroy();
        subText.destroy();
      },
    });
  }

  // ========================================================
  //  handlePlayerDeath — Death sequence with effects
  // ========================================================
  private handlePlayerDeath(): void {
    // Particle explosion
    this.particles.emitDeathBurst(this.player.x, this.player.y);

    // Camera effects
    this.cameraManager.playDeathEffect();

    // Audio
    this.audioManager.playDamage();
    this.audioManager.stopAmbient();

    // Hide player during death animation
    this.player.setVisible(false);

    this.time.delayedCall(1000, () => {
      this.restartLevel();
    });
  }

  // ========================================================
  //  restartLevel
  // ========================================================
  private restartLevel(): void {
    this.audioManager.stopAmbient();
    this.stopBGM();
    this.scene.restart({ levelIndex: this.currentLevelIndex });
  }

  // ========================================================
  //  togglePause
  // ========================================================
  private togglePause(): void {
    if (this.scene.isPaused()) {
      this.scene.resume();
    } else {
      this.scene.pause();
    }
  }

  // ========================================================
  //  BGM — Real background music using loaded audio files
  // ========================================================
  private startBGM(dimension: string): void {
    const key = dimension === DIMENSIONS.LUMINA ? 'bgm-lumina' : 'bgm-umbra';
    if (this.sound.get(key)) {
      this.bgm = this.sound.add(key, { loop: true, volume: 0.3 });
      this.bgm.play();
    }
  }

  private crossfadeBGM(newDimension: string): void {
    const newKey = newDimension === DIMENSIONS.LUMINA ? 'bgm-lumina' : 'bgm-umbra';

    // Fade out current BGM
    if (this.bgm && this.bgm.isPlaying) {
      this.tweens.add({
        targets: this.bgm,
        volume: 0,
        duration: 300,
        onComplete: () => {
          this.bgm?.stop();
          this.bgm?.destroy();

          // Start new BGM
          if (this.sound.get(newKey)) {
            this.bgm = this.sound.add(newKey, { loop: true, volume: 0 });
            this.bgm.play();
            this.tweens.add({
              targets: this.bgm,
              volume: 0.3,
              duration: 300,
            });
          }
        },
      });
    } else {
      this.startBGM(newDimension);
    }
  }

  private stopBGM(): void {
    if (this.bgm) {
      this.bgm.stop();
      this.bgm.destroy();
      this.bgm = undefined;
    }
  }
}
