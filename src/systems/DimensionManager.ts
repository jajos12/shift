// ============================================================
//  DimensionManager.ts — THE core system of the game
// ============================================================
//
//  GAME DEV CONCEPT: The "System" Pattern
//  ----------------------------------------
//  In game dev, a "System" is a class that manages a specific
//  aspect of the game world — physics, audio, AI, etc.
//  Systems don't represent visible things (like a player or enemy).
//  Instead, they coordinate HOW visible things behave.
//
//  DimensionManager is the most important system in SHIFT.
//  It controls:
//    1. Which dimension is currently active (Lumina or Umbra)
//    2. Which tilemap layer has active collisions
//    3. The visual opacity of each layer
//    4. The transition effect when shifting
//
//  HOW IT WORKS:
//  Both dimensions' tiles are ALWAYS drawn on screen. The active
//  dimension is fully opaque with collisions enabled. The inactive
//  dimension is semi-transparent (ghost) with collisions disabled.
//  When you "shift", they swap roles instantly.
// ============================================================

import type Phaser from 'phaser';
import { DIMENSIONS } from '../utils/Constants';

export type DimensionType = typeof DIMENSIONS.LUMINA | typeof DIMENSIONS.UMBRA;

export class DimensionManager {
  private scene: Phaser.Scene;

  // The current active dimension — player collides with this layer
  private current: DimensionType = DIMENSIONS.LUMINA;

  // References to both tilemap layers
  // (these are set up by GameScene and passed to us)
  private luminaLayer!: Phaser.Tilemaps.TilemapLayer;
  private umbraLayer!: Phaser.Tilemaps.TilemapLayer;

  // Prevents spamming shift — must wait for transition to finish
  private isShifting: boolean = false;

  // Callback that GameScene provides so we can update colliders
  private onShiftCallback?: () => void;

  // ========================================================
  //  Constructor
  // ========================================================
  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  // ========================================================
  //  init() — Called by GameScene after tilemap layers exist
  // ========================================================
  init(
    luminaLayer: Phaser.Tilemaps.TilemapLayer,
    umbraLayer: Phaser.Tilemaps.TilemapLayer,
    onShiftCallback: () => void
  ): void {
    this.luminaLayer = luminaLayer;
    this.umbraLayer = umbraLayer;
    this.onShiftCallback = onShiftCallback;

    // Set the initial state — Lumina is active, Umbra is ghost
    this.applyDimensionState();
  }

  // ========================================================
  //  shift() — The big moment! Swap dimensions!
  // ========================================================
  //
  //  Called when the player presses the SHIFT key.
  //  This is the ENTIRE core mechanic in one function:
  //    1. Swap which dimension is "current"
  //    2. Update tile collisions + opacity
  //    3. Play visual effect
  //    4. Notify GameScene to rebuild physics colliders
  //
  shift(): void {
    // Can't shift while already shifting (prevents rapid spamming)
    if (this.isShifting) return;
    this.isShifting = true;

    // --- Step 1: Flip the dimension ---
    this.current = this.current === DIMENSIONS.LUMINA
      ? DIMENSIONS.UMBRA
      : DIMENSIONS.LUMINA;

    // --- Step 2: Update tile layers (collisions + visuals) ---
    this.applyDimensionState();

    // --- Step 3: Tell GameScene to update its physics colliders ---
    // (Phaser needs to know which layer to collide the player against)
    if (this.onShiftCallback) {
      this.onShiftCallback();
    }

    // --- Step 5: Re-enable shifting after the transition ---
    this.scene.time.delayedCall(DIMENSIONS.SHIFT_DURATION_MS, () => {
      this.isShifting = false;
    });
  }

  // ========================================================
  //  applyDimensionState() — The actual swap logic
  // ========================================================
  //
  //  WHAT HAPPENS HERE:
  //  Active layer  → alpha = 1.0, collisions ON, no tint
  //  Inactive layer → alpha = 0.2, collisions OFF, colored tint
  //
  //  The tint makes it easy to tell which dimension is the "ghost":
  //  - Lumina ghost = warm golden tint
  //  - Umbra ghost = cool purple tint
  //
  private applyDimensionState(): void {
    const isLumina = this.current === DIMENSIONS.LUMINA;

    // Determine active and inactive layers
    const activeLayer = isLumina ? this.luminaLayer : this.umbraLayer;
    const inactiveLayer = isLumina ? this.umbraLayer : this.luminaLayer;
    const inactiveTint = isLumina ? DIMENSIONS.UMBRA_TINT : DIMENSIONS.LUMINA_TINT;

    // --- Active layer: solid, collidable ---
    activeLayer.setAlpha(1);

    // Clear tint on every tile in the active layer
    // (TilemapLayer doesn't have a direct clearTint method,
    //  so we iterate each tile and reset its tint to white/default)
    activeLayer.forEachTile((tile: Phaser.Tilemaps.Tile) => {
      tile.tint = 0xffffff;
    });

    // setCollisionByExclusion means "collide with every tile
    // EXCEPT the ones in this array". We exclude [0, -1]:
    //   0 = empty air (should never collide)
    //  -1 = doesn't exist (just a safety catch)
    activeLayer.setCollisionByExclusion([0, -1]);

    // Set the layer depth so active is drawn on top
    activeLayer.setDepth(1);

    // --- Inactive layer: ghostly, non-collidable ---
    inactiveLayer.setAlpha(DIMENSIONS.GHOST_ALPHA);

    // Tint each tile in the inactive layer to distinguish it
    inactiveLayer.forEachTile((tile: Phaser.Tilemaps.Tile) => {
      tile.tint = inactiveTint;
    });

    // Remove all collisions from inactive tiles
    inactiveLayer.forEachTile((tile: Phaser.Tilemaps.Tile) => {
      tile.setCollision(false);
    });

    // Draw behind the active layer
    inactiveLayer.setDepth(0);
  }

  // ========================================================
  //  Getters — Other systems need to know the current state
  // ========================================================

  getCurrent(): DimensionType {
    return this.current;
  }

  getActiveLayer(): Phaser.Tilemaps.TilemapLayer {
    return this.current === DIMENSIONS.LUMINA
      ? this.luminaLayer
      : this.umbraLayer;
  }

  getInactiveLayer(): Phaser.Tilemaps.TilemapLayer {
    return this.current === DIMENSIONS.LUMINA
      ? this.umbraLayer
      : this.luminaLayer;
  }

  getIsShifting(): boolean {
    return this.isShifting;
  }
}
