// ============================================================
//  AssetKeys.ts — String Keys for All Game Assets
// ============================================================
//
//  GAME DEV CONCEPT: Asset Keys
//  -----------------------------
//  When you load an image in Phaser, you give it a string key:
//    this.load.image('player', 'assets/player.png')
//  Later, you reference it by key: this.add.sprite(x, y, 'player')
//
//  If you typo the key ('playr'), the game silently breaks — no image
//  shows up. By putting all keys in one file, TypeScript catches typos
//  at compile time. Much better than debugging invisible sprites!
// ============================================================

export const ASSETS = {
  // Spritesheets (image + animation frames)
  PLAYER: 'player',

  // Tilesets (the palette of tiles for building levels)
  TILESET_LUMINA: 'tileset-lumina',
  TILESET_UMBRA: 'tileset-umbra',

  // Tilemaps (level layouts)
  MAP_TUTORIAL: 'map-tutorial',
  MAP_PUZZLE_1: 'map-puzzle-1',
  MAP_PUZZLE_2: 'map-puzzle-2',

  // Individual images
  HEART_FULL: 'heart-full',
  HEART_EMPTY: 'heart-empty',

  // Audio
  MUSIC_LUMINA: 'music-lumina',
  MUSIC_UMBRA: 'music-umbra',
  SFX_JUMP: 'sfx-jump',
  SFX_SHIFT: 'sfx-shift',
  SFX_LAND: 'sfx-land',
  SFX_DAMAGE: 'sfx-damage',

  // Particles
  PARTICLE_SHIFT: 'particle-shift',
  PARTICLE_DUST: 'particle-dust',
} as const;
