// ============================================================
//  ChaseEnemy.ts — Chases the player (Umbra-locked)
// ============================================================
//
//  GAME DEV CONCEPT: Chase AI
//  ----------------------------
//  Slightly more advanced than patrol: this enemy moves toward
//  the player when they're within detection range.
//
//  It creates TENSION — you can see the enemy approaching.
//  The player must shift to Lumina to escape, but that might
//  remove their platform!
//
//  DIMENSION: Umbra-locked. Shift to Lumina to escape.
//
//  The chase is horizontal only (no vertical climbing).
//  This keeps it predictable and fair.
// ============================================================

import { Enemy } from '../Enemy';
import { DIMENSIONS } from '../../utils/Constants';
import type { DimensionType } from '../../systems/DimensionManager';

export class ChaseEnemy extends Enemy {
  private detectionRange: number;
  private isChasing: boolean = false;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    detectionRange: number = 150
  ) {
    super(scene, x, y, 'enemy-chase', DIMENSIONS.UMBRA as DimensionType);

    this.detectionRange = detectionRange;
    this.moveSpeed = 70;

    // Enable gravity
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setGravityY(400);
  }

  // ========================================================
  //  Chase AI: move toward the player when in range
  // ========================================================
  updateAI(playerX: number, _playerY: number, _delta: number): void {
    if (!this.isActive) {
      const body = this.body as Phaser.Physics.Arcade.Body;
      body.setVelocityX(0);
      this.isChasing = false;
      return;
    }

    const body = this.body as Phaser.Physics.Arcade.Body;
    const distX = playerX - this.x;
    const distance = Math.abs(distX);

    // Start chasing if player is in detection range
    if (distance < this.detectionRange) {
      this.isChasing = true;
    }

    // Stop chasing if player is too far
    if (distance > this.detectionRange * 1.5) {
      this.isChasing = false;
    }

    if (this.isChasing) {
      // Move toward the player
      const dir = distX > 0 ? 1 : -1;
      body.setVelocityX(this.moveSpeed * dir);
      this.setFlipX(dir < 0);

      // Visual feedback: pulse when chasing
      this.setAlpha(0.8 + Math.sin(Date.now() * 0.01) * 0.2);
    } else {
      body.setVelocityX(0);
    }
  }
}
