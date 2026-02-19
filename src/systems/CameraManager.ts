// ============================================================
//  CameraManager.ts — Smooth camera follow + effects
// ============================================================
//
//  GAME DEV CONCEPT: Camera Systems
//  -----------------------------------
//  In platformers, the camera follows the player. But HOW it
//  follows makes a huge difference in feel:
//
//  Naive approach: camera.x = player.x (snaps instantly)
//  → Feels jittery and disorienting
//
//  Professional approach: camera LERPS (smoothly interpolates)
//  toward the player's position each frame. Plus:
//  - Dead zone: small area around center where player can move
//    without the camera reacting (prevents micro-jitter)
//  - Lookahead: camera shifts slightly in the direction the
//    player is MOVING, showing more of what's ahead
//
//  These techniques are used in every polished platformer
//  from Celeste to Hollow Knight.
// ============================================================

import Phaser from 'phaser';
import { WORLD } from '../utils/Constants';

export class CameraManager {
  private scene: Phaser.Scene;
  private camera!: Phaser.Cameras.Scene2D.Camera;
  // target reference kept for potential lookahead feature

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.camera = scene.cameras.main;
  }

  // ========================================================
  //  init — Set up camera to follow a target
  // ========================================================
  init(target: Phaser.Physics.Arcade.Sprite): void {
    // --- Follow the player with smooth interpolation ---
    // lerp: 0.1 = slow smooth follow, 1.0 = instant snap
    this.camera.startFollow(target, true, 0.08, 0.08);

    // --- Dead zone ---
    // A rectangle in the center of the screen where the player
    // can move without the camera reacting. Prevents jitter.
    this.camera.setDeadzone(80, 60);

    // --- World bounds ---
    // Camera can't scroll beyond the level boundaries
    this.camera.setBounds(0, 0, WORLD.WIDTH, WORLD.HEIGHT);

    // --- Slight zoom for a closer feel ---
    // 1.0 = normal, >1 = zoomed in
    this.camera.setZoom(1.0);
  }

  // ========================================================
  //  Shift flash — enhanced VFX for dimension swap
  // ========================================================
  playShiftEffect(isLumina: boolean): void {
    if (isLumina) {
      // Warm golden flash
      this.camera.flash(180, 255, 204, 68, true);
    } else {
      // Cool purple flash
      this.camera.flash(180, 102, 68, 204, true);
    }

    // Screen shake — stronger than before
    this.camera.shake(120, 0.008);

    // Brief zoom pulse for impact
    this.scene.tweens.add({
      targets: this.camera,
      zoom: 1.02,
      duration: 60,
      yoyo: true,
      ease: 'Quad.Out',
    });
  }

  // ========================================================
  //  Damage shake — when player gets hit
  // ========================================================
  playDamageEffect(): void {
    this.camera.shake(200, 0.015);
    this.camera.flash(100, 255, 50, 50, true);
  }

  // ========================================================
  //  Death effect — dramatic camera response
  // ========================================================
  playDeathEffect(): void {
    this.camera.shake(400, 0.025);
    this.camera.flash(300, 255, 30, 30, true);

    // Slow zoom in on death
    this.scene.tweens.add({
      targets: this.camera,
      zoom: 1.15,
      duration: 500,
      ease: 'Quad.In',
    });
  }

  // ========================================================
  //  Level complete effect — triumphant flash
  // ========================================================
  playLevelCompleteEffect(): void {
    this.camera.flash(500, 68, 255, 170, true);
    this.camera.shake(100, 0.003);
  }

  // ========================================================
  //  Reset — restore camera state (useful on level restart)
  // ========================================================
  reset(): void {
    this.camera.setZoom(1.0);
    this.camera.stopFollow();
  }
}
