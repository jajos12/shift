// ============================================================
//  MenuScene.ts — The title screen
// ============================================================
//
//  GAME DEV CONCEPT: Title Screens
//  ---------------------------------
//  The title screen is the player's first impression. Even for
//  a prototype, a good title screen makes the game feel "real".
//  It should:
//    1. Show the game name prominently
//    2. Give clear instructions to start
//    3. Set the mood (colors, font, animations)
// ============================================================

import Phaser from 'phaser';
import { WORLD, COLORS } from '../utils/Constants';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
  }

  create(): void {
    const cx = WORLD.WIDTH / 2;
    const cy = WORLD.HEIGHT / 2;

    // --- Dark background ---
    this.cameras.main.setBackgroundColor(0x0a0a1a);

    // --- Floating particle animation (background ambiance) ---
    this.createAmbientParticles();

    // --- Title ---
    const title = this.add.text(cx, cy - 120, 'SHIFT', {
      fontSize: '72px',
      fontFamily: 'monospace',
      color: '#44ddff',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Subtle glow pulsing on the title
    this.tweens.add({
      targets: title,
      alpha: { from: 0.8, to: 1 },
      duration: 1500,
      yoyo: true,
      repeat: -1,      // -1 = infinite repeat
      ease: 'Sine.InOut', // Smooth sinusoidal easing
    });

    // --- Subtitle ---
    this.add.text(cx, cy - 60, 'A Dimension-Swapping Platformer', {
      fontSize: '16px',
      fontFamily: 'monospace',
      color: '#888899',
    }).setOrigin(0.5);

    // --- Dimension labels (aesthetic touch) ---
    const luminaText = this.add.text(cx - 100, cy + 20, '☀ LUMINA', {
      fontSize: '18px',
      fontFamily: 'monospace',
      color: '#ffcc44',
    }).setOrigin(0.5);

    const umbraText = this.add.text(cx + 100, cy + 20, '🌙 UMBRA', {
      fontSize: '18px',
      fontFamily: 'monospace',
      color: '#6644cc',
    }).setOrigin(0.5);

    // Alternating pulse between dimension names
    this.tweens.add({
      targets: luminaText,
      alpha: { from: 1, to: 0.3 },
      duration: 2000,
      yoyo: true,
      repeat: -1,
    });
    this.tweens.add({
      targets: umbraText,
      alpha: { from: 0.3, to: 1 },
      duration: 2000,
      yoyo: true,
      repeat: -1,
    });

    // --- Controls info ---
    this.add.text(cx, cy + 90, [
      '← → or A/D  —  Move',
      '↑ or W or SPACE  —  Jump',
      'SHIFT  —  Switch Dimension',
    ].join('\n'), {
      fontSize: '13px',
      fontFamily: 'monospace',
      color: '#666677',
      align: 'center',
      lineSpacing: 6,
    }).setOrigin(0.5);

    // --- Start prompt ---
    const startText = this.add.text(cx, cy + 180, '[ Press ENTER or SPACE to Start ]', {
      fontSize: '18px',
      fontFamily: 'monospace',
      color: '#44ffaa',
    }).setOrigin(0.5);

    // Blinking start prompt
    this.tweens.add({
      targets: startText,
      alpha: { from: 1, to: 0 },
      duration: 800,
      yoyo: true,
      repeat: -1,
    });

    // --- Input: Start the game ---
    // 'keydown-ENTER' fires once when Enter is pressed (not held)
    this.input.keyboard?.on('keydown-ENTER', () => {
      this.scene.start('GameScene', { levelIndex: 0 });
    });
    this.input.keyboard?.on('keydown-SPACE', () => {
      this.scene.start('GameScene', { levelIndex: 0 });
    });
  }

  // ========================================================
  //  createAmbientParticles — Floating dots for atmosphere
  // ========================================================
  private createAmbientParticles(): void {
    // Create some floating dots that drift upward
    for (let i = 0; i < 30; i++) {
      const x = Phaser.Math.Between(0, WORLD.WIDTH);
      const y = Phaser.Math.Between(0, WORLD.HEIGHT);
      const size = Phaser.Math.Between(1, 3);
      const isLumina = Math.random() > 0.5;

      const dot = this.add.circle(x, y, size,
        isLumina ? COLORS.LUMINA_GROUND : COLORS.UMBRA_GROUND,
        Phaser.Math.FloatBetween(0.1, 0.4)
      );

      // Each dot drifts upward slowly and wraps around
      this.tweens.add({
        targets: dot,
        y: -10,
        x: x + Phaser.Math.Between(-50, 50),
        duration: Phaser.Math.Between(4000, 10000),
        repeat: -1,
        onRepeat: () => {
          dot.x = Phaser.Math.Between(0, WORLD.WIDTH);
          dot.y = WORLD.HEIGHT + 10;
        },
      });
    }
  }
}
