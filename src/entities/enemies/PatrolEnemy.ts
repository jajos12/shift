// ============================================================
//  PatrolEnemy.ts — Walks back and forth (Lumina-locked)
// ============================================================
//
//  GAME DEV CONCEPT: Patrol AI
//  -----------------------------
//  The simplest enemy AI: walk in one direction until you hit
//  a wall or reach a patrol boundary, then reverse.
//
//  This is predictable and learnable — the player can easily
//  time their movements to avoid it. Perfect for early levels.
//
//  DIMENSION: Lumina-locked. Shift to Umbra to pass safely.
// ============================================================

import { Enemy } from '../Enemy';
import { DIMENSIONS } from '../../utils/Constants';
import type { DimensionType } from '../../systems/DimensionManager';

export class PatrolEnemy extends Enemy {
  private patrolDir: number = 1; // 1 = right, -1 = left
  private patrolRange: number;
  private startX: number;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    patrolRange: number = 100
  ) {
    super(scene, x, y, 'enemy-patrol-static', DIMENSIONS.LUMINA as DimensionType);

    this.startX = x;
    this.patrolRange = patrolRange;
    this.moveSpeed = 50;

    // Enable gravity so the enemy stands on platforms
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setGravityY(400);

    // Play patrol run animation
    this.play('enemy-patrol-run');
  }

  // ========================================================
  //  Patrol AI: walk back and forth
  // ========================================================
  updateAI(_playerX: number, _playerY: number, _delta: number): void {
    if (!this.isActive) {
      // Ghosted — stop moving
      const body = this.body as Phaser.Physics.Arcade.Body;
      body.setVelocityX(0);
      return;
    }

    const body = this.body as Phaser.Physics.Arcade.Body;

    // Move in current direction
    body.setVelocityX(this.moveSpeed * this.patrolDir);

    // Reverse if:
    // 1. Hit a wall
    // 2. Reached patrol boundary
    if (body.blocked.left || body.blocked.right) {
      this.patrolDir *= -1;
    }

    if (Math.abs(this.x - this.startX) > this.patrolRange) {
      this.patrolDir = this.x > this.startX ? -1 : 1;
    }

    // Flip sprite based on direction
    this.setFlipX(this.patrolDir < 0);
  }
}
