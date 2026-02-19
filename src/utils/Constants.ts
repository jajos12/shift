// ============================================================
//  Constants.ts — The "Tuning Panel" of the game
// ============================================================
//
//  GAME DEV CONCEPT: Magic Numbers
//  --------------------------------
//  In game dev, "magic numbers" are raw values scattered through code
//  like: player.setVelocityX(200). If you want to make the player
//  faster, you'd have to search every file for "200". Nightmare.
//
//  Instead, we put ALL tunable values here. Want the player to jump
//  higher? Change JUMP_VELOCITY. Want gravity stronger? Change GRAVITY.
//  One file, instant game-feel changes.
//
//  The `as const` at the end makes these values READONLY — TypeScript
//  will yell at you if you try to change them at runtime.
// ============================================================

export const PLAYER = {
  // --- Movement ---
  SPEED: 200,             // Horizontal run speed (pixels per second)
  JUMP_VELOCITY: -420,    // Negative = upward (Phaser's Y-axis points DOWN!)
  WALL_SLIDE_SPEED: 60,   // Slower fall speed when sliding down a wall
  WALL_JUMP_VELOCITY_X: 250, // Horizontal push when wall-jumping
  WALL_JUMP_VELOCITY_Y: -380, // Vertical push when wall-jumping
  COYOTE_TIME_MS: 100,    // Grace period: you can still jump 100ms after leaving a ledge
  JUMP_BUFFER_MS: 100,    // If you press jump 100ms BEFORE landing, it still counts

  // --- Combat ---
  MAX_HEALTH: 5,
  INVINCIBILITY_MS: 1000, // After taking damage, you're invincible for 1 second
  KNOCKBACK_X: 200,       // Horizontal knockback when hit
  KNOCKBACK_Y: -200,      // Vertical knockback when hit

  // --- Physics Body ---
  BODY_WIDTH: 18,         // Hitbox width (smaller than sprite for fairness)
  BODY_HEIGHT: 28,        // Hitbox height
  BODY_OFFSET_X: 7,       // Offset to center the smaller hitbox
  BODY_OFFSET_Y: 4,
} as const;

export const WORLD = {
  TILE_SIZE: 32,           // Each tile is 32×32 pixels
  WIDTH: 960,              // Game canvas width (30 tiles × 32px)
  HEIGHT: 640,             // Game canvas height (20 tiles × 32px)
  TILES_X: 30,             // Number of horizontal tiles
  TILES_Y: 20,             // Number of vertical tiles
} as const;

export const DIMENSIONS = {
  LUMINA: 'lumina' as const,
  UMBRA: 'umbra' as const,
  SHIFT_DURATION_MS: 200,  // How long the shift transition lasts
  GHOST_ALPHA: 0.2,        // Opacity of the inactive dimension's tiles
  LUMINA_TINT: 0xffcc44,   // Warm gold tint for Lumina ghost
  UMBRA_TINT: 0x6644cc,    // Cool purple tint for Umbra ghost
} as const;

// Colors for our procedurally generated placeholder sprites
export const COLORS = {
  // Lumina palette (warm)
  LUMINA_GROUND: 0xd4a853,    // Golden stone
  LUMINA_PLATFORM: 0xc9943a,  // Darker gold
  LUMINA_BG: 0x2a1f0e,        // Dark warm background

  // Umbra palette (cool)
  UMBRA_GROUND: 0x6b4fa0,     // Purple stone
  UMBRA_PLATFORM: 0x5a3d8f,   // Darker purple
  UMBRA_BG: 0x0e0a1f,         // Dark cool background

  // Player
  PLAYER_FILL: 0x44ddff,      // Cyan — stands out in both dimensions
  PLAYER_OUTLINE: 0x2299bb,

  // Enemies
  ENEMY_LUMINA: 0xff5544,     // Red — Lumina enemies
  ENEMY_UMBRA: 0x44ffaa,      // Teal — Umbra enemies

  // UI
  HEALTH_FULL: 0xff4444,
  HEALTH_EMPTY: 0x333333,
  TEXT_PRIMARY: 0xffffff,
  TEXT_SECONDARY: 0xaaaaaa,
} as const;
