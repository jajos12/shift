// ============================================================
//  ParallaxBackground.ts — Multi-layer depth background
// ============================================================
//
//  GAME DEV CONCEPT: Parallax Scrolling
//  --------------------------------------
//  Parallax is one of the oldest tricks in 2D game dev.
//  Multiple background layers scroll at DIFFERENT SPEEDS.
//  Layers closer to the "camera" move faster; far layers move slower.
//  This creates an illusion of DEPTH in a 2D world.
//
//  Real-world analogy: look out a car window. Trees nearby blur past,
//  but mountains in the distance barely move. Same principle!
//
//  This version uses REAL loaded background images with an
//  additional procedural foreground layer on top.
// ============================================================

import Phaser from 'phaser';
import { WORLD, DIMENSIONS } from '../utils/Constants';

export class ParallaxBackground {
  private scene: Phaser.Scene;
  private bgImage!: Phaser.GameObjects.Image;
  private foreLayer!: Phaser.GameObjects.Graphics;
  private currentDimension: string = DIMENSIONS.LUMINA;

  // Color palettes for the foreground shapes
  private readonly luminaPalette = {
    near: [0xebc46a, 0xd9b252, 0xc8a040],
  };

  private readonly umbraPalette = {
    near: [0x8b6fc0, 0x7a5eaf, 0x694d9e],
  };

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.createLayers();
  }

  // ========================================================
  //  Create the parallax layers using real images
  // ========================================================
  private createLayers(): void {
    const bgKey = this.currentDimension === DIMENSIONS.LUMINA
      ? 'bg-lumina' : 'bg-umbra';

    // Main background image — slowest layer, covers the whole view
    this.bgImage = this.scene.add.image(
      WORLD.WIDTH / 2,
      WORLD.HEIGHT / 2,
      bgKey
    );
    this.bgImage.setDepth(-30);
    this.bgImage.setScrollFactor(0); // Fixed in place
    this.bgImage.setDisplaySize(WORLD.WIDTH, WORLD.HEIGHT);

    // Semi-transparent foreground shapes for depth
    this.foreLayer = this.scene.add.graphics();
    this.foreLayer.setDepth(-10);
    this.foreLayer.setScrollFactor(0.3);
    this.drawForeground();
  }

  // ========================================================
  //  Draw procedural foreground elements
  // ========================================================
  private drawForeground(): void {
    const palette = this.currentDimension === DIMENSIONS.LUMINA
      ? this.luminaPalette
      : this.umbraPalette;

    const near = this.foreLayer;
    near.clear();

    const extendedW = WORLD.WIDTH * 2;
    const extendedH = WORLD.HEIGHT * 2;
    const offsetX = -WORLD.WIDTH / 2;
    const offsetY = -WORLD.HEIGHT / 2;

    for (let i = 0; i < 10; i++) {
      const x = offsetX + Math.random() * extendedW;
      const y = offsetY + Math.random() * extendedH;
      const w = 20 + Math.random() * 60;
      const h = 20 + Math.random() * 40;
      const color = palette.near[Math.floor(Math.random() * palette.near.length)];
      near.fillStyle(color, 0.03 + Math.random() * 0.06);
      near.fillRect(x, y, w, h);
    }
  }

  // ========================================================
  //  Called by GameScene when dimension changes
  // ========================================================
  onDimensionShift(newDimension: string): void {
    this.currentDimension = newDimension;

    // Cross-fade background image
    this.scene.tweens.add({
      targets: this.bgImage,
      alpha: 0,
      duration: 100,
      yoyo: true,
      onYoyo: () => {
        const bgKey = newDimension === DIMENSIONS.LUMINA
          ? 'bg-lumina' : 'bg-umbra';
        this.bgImage.setTexture(bgKey);
        this.drawForeground();
      },
    });

    // Fade foreground too
    this.scene.tweens.add({
      targets: this.foreLayer,
      alpha: 0,
      duration: 100,
      yoyo: true,
    });
  }

  destroy(): void {
    this.bgImage?.destroy();
    this.foreLayer?.destroy();
  }
}
