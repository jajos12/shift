// ============================================================
//  ParticleManager.ts — Manages all particle effects
// ============================================================
//
//  GAME DEV CONCEPT: Particle Systems
//  ------------------------------------
//  A particle system emits many small sprites (particles) that
//  move, fade, and die over time. They're used for:
//    - Explosions, fire, smoke
//    - Dust on landing, jump trails
//    - Ambient atmosphere (floating motes)
//    - VFX feedback (damage, healing, shifting)
//
//  Particles are lightweight — you can have hundreds without
//  performance issues. They make a game feel ALIVE.
//
//  In Phaser, particles are managed by ParticleEmitters.
//  Each emitter has a config: speed, lifespan, alpha, scale, etc.
//  You can fire them once (burst) or continuously (flow).
// ============================================================

import Phaser from 'phaser';
import { DIMENSIONS, COLORS } from '../utils/Constants';

export class ParticleManager {
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  // ========================================================
  //  Shift burst — pixel debris on dimension swap
  // ========================================================
  emitShiftBurst(x: number, y: number, dimension: string): void {
    const isLumina = dimension === DIMENSIONS.LUMINA;
    const tint = isLumina ? COLORS.LUMINA_GROUND : COLORS.UMBRA_GROUND;
    const tint2 = isLumina ? 0xffcc44 : 0x8866dd;

    // Create a temporary emitter that fires and cleans up
    const emitter = this.scene.add.particles(x, y, 'particle-med', {
      speed: { min: 80, max: 200 },
      angle: { min: 0, max: 360 },
      scale: { start: 1, end: 0 },
      alpha: { start: 0.8, end: 0 },
      lifespan: 400,
      tint: [tint, tint2, 0xffffff],
      quantity: 20,
      emitting: false,
    });

    emitter.setDepth(50);
    emitter.explode(20);

    // Auto-destroy after particles are done
    this.scene.time.delayedCall(500, () => emitter.destroy());
  }

  // ========================================================
  //  Landing dust — puff when player hits ground
  // ========================================================
  emitLandingDust(x: number, y: number): void {
    const emitter = this.scene.add.particles(x, y, 'particle', {
      speed: { min: 20, max: 50 },
      angle: { min: 240, max: 300 }, // Spread upward/sideways
      scale: { start: 0.8, end: 0 },
      alpha: { start: 0.5, end: 0 },
      lifespan: 300,
      tint: 0xaaaaaa,
      quantity: 6,
      gravityY: -20,
      emitting: false,
    });

    emitter.setDepth(5);
    emitter.explode(6);
    this.scene.time.delayedCall(400, () => emitter.destroy());
  }

  // ========================================================
  //  Jump trail — small particles left behind while airborne
  // ========================================================
  emitJumpParticle(x: number, y: number): void {
    const emitter = this.scene.add.particles(x, y + 10, 'particle', {
      speed: { min: 5, max: 15 },
      angle: { min: 80, max: 100 },
      scale: { start: 0.5, end: 0 },
      alpha: { start: 0.4, end: 0 },
      lifespan: 200,
      tint: COLORS.PLAYER_FILL,
      quantity: 1,
      emitting: false,
    });

    emitter.setDepth(4);
    emitter.explode(1);
    this.scene.time.delayedCall(300, () => emitter.destroy());
  }

  // ========================================================
  //  Portal particles — continuous glow around exit
  // ========================================================
  createPortalEmitter(x: number, y: number): Phaser.GameObjects.Particles.ParticleEmitter {
    const emitter = this.scene.add.particles(x, y, 'particle-glow', {
      speed: { min: 10, max: 30 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.5, end: 0 },
      alpha: { start: 0.4, end: 0 },
      lifespan: { min: 800, max: 1500 },
      tint: [0x44ffaa, 0x88ffcc, 0xffffff],
      frequency: 100,
      quantity: 1,
    });

    emitter.setDepth(4);
    return emitter;
  }

  // ========================================================
  //  Death burst — player death explosion
  // ========================================================
  emitDeathBurst(x: number, y: number): void {
    const emitter = this.scene.add.particles(x, y, 'particle-med', {
      speed: { min: 50, max: 180 },
      angle: { min: 0, max: 360 },
      scale: { start: 1.2, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: 600,
      tint: [COLORS.PLAYER_FILL, 0xffffff, 0xff4444],
      quantity: 25,
      emitting: false,
    });

    emitter.setDepth(50);
    emitter.explode(25);
    this.scene.time.delayedCall(700, () => emitter.destroy());
  }

  // ========================================================
  //  Ambient motes — floating particles for atmosphere
  // ========================================================
  createAmbientEmitter(dimension: string): Phaser.GameObjects.Particles.ParticleEmitter {
    const isLumina = dimension === DIMENSIONS.LUMINA;
    const tint = isLumina
      ? [0xffdd88, 0xffcc66, COLORS.LUMINA_GROUND]
      : [0xaa88ff, 0x9977ee, COLORS.UMBRA_GROUND];

    const emitter = this.scene.add.particles(0, 0, 'particle', {
      emitZone: {
        type: 'random',
        source: new Phaser.Geom.Rectangle(0, 0, 960, 640),
        quantity: 1,
      },
      speed: { min: 5, max: 15 },
      angle: { min: 260, max: 280 }, // Drift upward
      scale: { start: 0.3, end: 0 },
      alpha: { start: 0.2, end: 0 },
      lifespan: { min: 3000, max: 6000 },
      tint: tint,
      frequency: 400,
      quantity: 1,
    });

    emitter.setDepth(2);
    return emitter;
  }
}
