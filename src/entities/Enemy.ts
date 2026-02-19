// ============================================================
//  Enemy.ts — Base class for all enemies
// ============================================================
//
//  GAME DEV CONCEPT: Dimension-Locked Enemies
//  --------------------------------------------
//  In SHIFT, enemies belong to a specific dimension (Lumina or Umbra).
//  When the player shifts to a different dimension, the enemy becomes
//  a harmless ghost — no collision, no damage. This creates a unique
//  tactical choice: shift to avoid danger, but you might lose your
//  platform!
//
//  Each enemy type has different AI:
//  - Patrol: walks back and forth (predictable, beginner-friendly)
//  - Chase: moves toward the player (threatening, requires strategy)
//
//  Both share common behavior (this base class):
//  - Dimension affinity (only dangerous in their dimension)
//  - Ghost rendering when inactive
//  - Contact damage to the player
// ============================================================

import Phaser from 'phaser';
import { DIMENSIONS } from '../utils/Constants';
import type { DimensionType } from '../systems/DimensionManager';

export abstract class Enemy extends Phaser.Physics.Arcade.Sprite {
  protected dimension: DimensionType;
  protected damage: number = 1;
  protected isActive: boolean = true; // Active = in its dimension
  protected moveSpeed: number = 60;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    texture: string,
    dimension: DimensionType
  ) {
    super(scene, x, y, texture);

    this.dimension = dimension;

    // Add to scene & enable physics
    scene.add.existing(this);
    scene.physics.add.existing(this);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setCollideWorldBounds(true);
    body.setSize(24, 24);
    body.setOffset(4, 4);

    this.setDepth(8);
  }

  // ========================================================
  //  Called when the active dimension changes
  // ========================================================
  onDimensionShift(currentDimension: DimensionType): void {
    this.isActive = currentDimension === this.dimension;

    if (this.isActive) {
      // Enemy is in its dimension — dangerous!
      this.setAlpha(1);
      this.clearTint();
      const body = this.body as Phaser.Physics.Arcade.Body;
      body.enable = true;
    } else {
      // Enemy is ghosted — harmless
      this.setAlpha(DIMENSIONS.GHOST_ALPHA);
      const tint = this.dimension === DIMENSIONS.LUMINA
        ? DIMENSIONS.LUMINA_TINT
        : DIMENSIONS.UMBRA_TINT;
      this.setTint(tint);
      const body = this.body as Phaser.Physics.Arcade.Body;
      body.enable = false;
    }
  }

  // ========================================================
  //  Abstract method — each enemy type implements its AI
  // ========================================================
  abstract updateAI(playerX: number, playerY: number, delta: number): void;

  // ========================================================
  //  Check if enemy can damage the player right now
  // ========================================================
  canDamage(): boolean {
    return this.isActive;
  }

  getDamage(): number {
    return this.damage;
  }

  getDimension(): DimensionType {
    return this.dimension;
  }
}
