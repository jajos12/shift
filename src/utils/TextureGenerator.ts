// ============================================================
//  TextureGenerator.ts — Procedural textures with DETAIL
// ============================================================
//
//  GAME DEV CONCEPT: Procedural Textures (Advanced)
//  --------------------------------------------------
//  The prototype used flat colored rectangles. Real procedural
//  textures use techniques like:
//    - Noise: random variation in color per-pixel
//    - Edge highlights: bright top/left edges (light source)
//    - Inner shadows: dark bottom/right edges (depth)
//    - Surface patterns: cracks, grain, crystals
//
//  These techniques make flat shapes feel 3D and textured,
//  even without artist-drawn sprites. Many indie games ship
//  with entirely procedural art!
// ============================================================

import { WORLD, COLORS, PLAYER } from './Constants';

// Helper: convert a hex color to { r, g, b }
function hexToRgb(hex: number): { r: number; g: number; b: number } {
  return {
    r: (hex >> 16) & 0xff,
    g: (hex >> 8) & 0xff,
    b: hex & 0xff,
  };
}

// Helper: darken a color by a percentage (0-1)
function darken(hex: number, amount: number): number {
  const c = hexToRgb(hex);
  const f = 1 - amount;
  return ((Math.round(c.r * f)) << 16) |
         ((Math.round(c.g * f)) << 8) |
         Math.round(c.b * f);
}

// Helper: lighten a color by a percentage
function lighten(hex: number, amount: number): number {
  const c = hexToRgb(hex);
  const f = amount;
  const r = Math.min(255, Math.round(c.r + (255 - c.r) * f));
  const g = Math.min(255, Math.round(c.g + (255 - c.g) * f));
  const b = Math.min(255, Math.round(c.b + (255 - c.b) * f));
  return (r << 16) | (g << 8) | b;
}


// ============================================================
//  Main texture generation
// ============================================================
export function generateTextures(scene: Phaser.Scene): void {
  const ts = WORLD.TILE_SIZE;

  // -------------------------------------------------------
  //  LUMINA TILESET — Composited from loaded tile images
  // -------------------------------------------------------
  //  Tilesets in Phaser need to be a single image with tiles
  //  laid out side by side. We use RenderTexture to composite
  //  the individual loaded tile images into one strip.
  const luminaRT = scene.add.renderTexture(0, 0, ts * 2, ts);
  luminaRT.draw('tile-lumina-ground', 0, 0);
  luminaRT.draw('tile-lumina-platform', ts, 0);
  luminaRT.saveTexture('tileset-lumina');
  luminaRT.destroy();

  // -------------------------------------------------------
  //  UMBRA TILESET — Same approach
  // -------------------------------------------------------
  const umbraRT = scene.add.renderTexture(0, 0, ts * 2, ts);
  umbraRT.draw('tile-umbra-ground', 0, 0);
  umbraRT.draw('tile-umbra-platform', ts, 0);
  umbraRT.saveTexture('tileset-umbra');
  umbraRT.destroy();

  // -------------------------------------------------------
  //  PLAYER TEXTURE — Glowing humanoid with energy outline
  // -------------------------------------------------------
  const pw = PLAYER.BODY_WIDTH + PLAYER.BODY_OFFSET_X * 2;
  const ph = PLAYER.BODY_HEIGHT + PLAYER.BODY_OFFSET_Y * 2;
  const playerGfx = scene.add.graphics();

  // Outer glow (drawn first, behind everything)
  playerGfx.fillStyle(COLORS.PLAYER_FILL, 0.1);
  playerGfx.fillRoundedRect(4, 6, 24, 28, 5);

  // Body
  playerGfx.fillStyle(COLORS.PLAYER_FILL, 0.9);
  playerGfx.fillRoundedRect(7, 9, 18, 22, 3);

  // Body shading (darker at bottom)
  playerGfx.fillStyle(darken(COLORS.PLAYER_FILL, 0.3), 0.4);
  playerGfx.fillRect(8, 22, 16, 8);

  // Body highlight (lighter at top)
  playerGfx.fillStyle(lighten(COLORS.PLAYER_FILL, 0.3), 0.3);
  playerGfx.fillRect(8, 10, 16, 6);

  // Head
  playerGfx.fillStyle(COLORS.PLAYER_FILL);
  playerGfx.fillCircle(16, 6, 6);

  // Head highlight
  playerGfx.fillStyle(lighten(COLORS.PLAYER_FILL, 0.4), 0.4);
  playerGfx.fillCircle(14, 4, 3);

  // Eyes (with slight glow)
  playerGfx.fillStyle(0xffffff, 0.9);
  playerGfx.fillCircle(13, 5, 2);
  playerGfx.fillCircle(19, 5, 2);
  playerGfx.fillStyle(0x112244);
  playerGfx.fillCircle(13.5, 5, 1);
  playerGfx.fillCircle(19.5, 5, 1);

  // Energy outline
  playerGfx.lineStyle(1.5, lighten(COLORS.PLAYER_FILL, 0.3), 0.7);
  playerGfx.strokeRoundedRect(7, 9, 18, 22, 3);
  playerGfx.strokeCircle(16, 6, 6);

  playerGfx.generateTexture('player', pw, ph);
  playerGfx.destroy();

  // -------------------------------------------------------
  //  EXIT PORTAL — Multi-ring glowing portal
  // -------------------------------------------------------
  const exitGfx = scene.add.graphics();

  // Outer glow
  exitGfx.fillStyle(0x44ffaa, 0.08);
  exitGfx.fillCircle(16, 16, 15);
  exitGfx.fillStyle(0x44ffaa, 0.12);
  exitGfx.fillCircle(16, 16, 12);

  // Rings
  exitGfx.lineStyle(2, 0x44ffaa, 0.9);
  exitGfx.strokeCircle(16, 16, 12);
  exitGfx.lineStyle(1.5, 0x88ffcc, 0.6);
  exitGfx.strokeCircle(16, 16, 8);
  exitGfx.lineStyle(1, 0xffffff, 0.3);
  exitGfx.strokeCircle(16, 16, 4);

  // Center bright point
  exitGfx.fillStyle(0xffffff, 0.5);
  exitGfx.fillCircle(16, 16, 3);

  exitGfx.generateTexture('exit-portal', ts, ts);
  exitGfx.destroy();

  // -------------------------------------------------------
  //  PARTICLE TEXTURES (multiple sizes for variety)
  // -------------------------------------------------------
  // Small particle (for ambient / dust)
  const p1 = scene.add.graphics();
  p1.fillStyle(0xffffff);
  p1.fillCircle(2, 2, 2);
  p1.generateTexture('particle', 4, 4);
  p1.destroy();

  // Medium particle (for shift effects)
  const p2 = scene.add.graphics();
  p2.fillStyle(0xffffff, 0.9);
  p2.fillCircle(3, 3, 3);
  p2.fillStyle(0xffffff, 0.4);
  p2.fillCircle(3, 3, 1);
  p2.generateTexture('particle-med', 6, 6);
  p2.destroy();

  // Glow particle (for portal / shift)
  const p3 = scene.add.graphics();
  p3.fillStyle(0xffffff, 0.3);
  p3.fillCircle(4, 4, 4);
  p3.fillStyle(0xffffff, 0.6);
  p3.fillCircle(4, 4, 2);
  p3.generateTexture('particle-glow', 8, 8);
  p3.destroy();

  // -------------------------------------------------------
  //  ENEMY TEXTURES
  // -------------------------------------------------------
  // Patrol enemy (Lumina) — spiky red shape
  const enemyLGfx = scene.add.graphics();
  enemyLGfx.fillStyle(COLORS.ENEMY_LUMINA, 0.9);
  enemyLGfx.fillRect(4, 8, 24, 20);
  enemyLGfx.fillStyle(COLORS.ENEMY_LUMINA);
  // Spiky top
  enemyLGfx.fillTriangle(4, 8, 10, 2, 16, 8);
  enemyLGfx.fillTriangle(14, 8, 20, 0, 28, 8);
  // Eyes
  enemyLGfx.fillStyle(0xffffff, 0.9);
  enemyLGfx.fillCircle(12, 16, 3);
  enemyLGfx.fillCircle(20, 16, 3);
  enemyLGfx.fillStyle(0x111111);
  enemyLGfx.fillCircle(13, 16, 1.5);
  enemyLGfx.fillCircle(21, 16, 1.5);
  // Outline
  enemyLGfx.lineStyle(1, darken(COLORS.ENEMY_LUMINA, 0.3), 0.7);
  enemyLGfx.strokeRect(4, 8, 24, 20);
  enemyLGfx.generateTexture('enemy-patrol', ts, ts);
  enemyLGfx.destroy();

  // Chase enemy (Umbra) — ghostly circle
  const enemyUGfx = scene.add.graphics();
  enemyUGfx.fillStyle(COLORS.ENEMY_UMBRA, 0.2);
  enemyUGfx.fillCircle(16, 14, 14);
  enemyUGfx.fillStyle(COLORS.ENEMY_UMBRA, 0.7);
  enemyUGfx.fillCircle(16, 14, 10);
  // Wavy bottom for ghostly look
  enemyUGfx.fillStyle(COLORS.ENEMY_UMBRA, 0.7);
  enemyUGfx.fillRect(6, 22, 20, 6);
  enemyUGfx.fillStyle(0x000000, 0.15);
  for (let i = 0; i < 5; i++) {
    enemyUGfx.fillRect(6 + i * 4, 26 + (i % 2 === 0 ? 0 : 2), 4, 4);
  }
  // Eyes
  enemyUGfx.fillStyle(0xffffff, 0.95);
  enemyUGfx.fillCircle(12, 12, 3);
  enemyUGfx.fillCircle(20, 12, 3);
  enemyUGfx.fillStyle(0x112233);
  enemyUGfx.fillCircle(13, 12, 1.5);
  enemyUGfx.fillCircle(21, 12, 1.5);
  // Glow outline
  enemyUGfx.lineStyle(1, lighten(COLORS.ENEMY_UMBRA, 0.3), 0.5);
  enemyUGfx.strokeCircle(16, 14, 10);
  enemyUGfx.generateTexture('enemy-chase', ts, ts);
  enemyUGfx.destroy();

  // -------------------------------------------------------
  //  SPIKE HAZARD TEXTURE
  // -------------------------------------------------------
  const spikeGfx = scene.add.graphics();
  spikeGfx.fillStyle(0xcc3333, 0.9);
  // Row of 3 spikes
  spikeGfx.fillTriangle(2, ts, 8, 4, 14, ts);
  spikeGfx.fillTriangle(10, ts, 16, 2, 22, ts);
  spikeGfx.fillTriangle(18, ts, 24, 6, 30, ts);
  // Highlights on spike edges
  spikeGfx.lineStyle(1, 0xff6666, 0.5);
  spikeGfx.lineBetween(8, 4, 2, ts);
  spikeGfx.lineBetween(16, 2, 10, ts);
  spikeGfx.lineBetween(24, 6, 18, ts);
  spikeGfx.generateTexture('spike', ts, ts);
  spikeGfx.destroy();
}
