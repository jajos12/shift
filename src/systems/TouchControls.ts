// ============================================================
//  TouchControls.ts — On-screen virtual controls for mobile
// ============================================================
//
//  GAME DEV CONCEPT: Virtual Gamepad
//  -----------------------------------
//  Mobile devices have no physical buttons, so we draw them on
//  screen. The tricky part is MULTI-TOUCH: the player needs to
//  hold a direction button AND tap jump at the same time.
//
//  Phaser supports up to 10 simultaneous pointers. We use
//  pointer events on individual game objects so each button
//  tracks its own pressed/released state independently.
//
//  DESIGN PRINCIPLES:
//  1. Auto-detect: only show on touch-capable devices
//  2. Semi-transparent: don't obscure gameplay
//  3. Ergonomic: left thumb = movement, right thumb = actions
//  4. Responsive: scale button size based on screen dimensions
// ============================================================

import Phaser from 'phaser';
import { WORLD } from '../utils/Constants';

// ============================================================
//  Readable input state — consumed by Player.ts each frame
// ============================================================
export interface TouchInputState {
  leftDown: boolean;
  rightDown: boolean;
  jumpJustPressed: boolean;
  shiftJustPressed: boolean;
}

export class TouchControls {
  private scene: Phaser.Scene;

  // --- Button GameObjects ---
  private btnLeft!: Phaser.GameObjects.Container;
  private btnRight!: Phaser.GameObjects.Container;
  private btnJump!: Phaser.GameObjects.Container;
  private btnShift!: Phaser.GameObjects.Container;

  // --- Internal pressed state ---
  private _leftDown = false;
  private _rightDown = false;

  // --- "Just pressed" tracking (fires once then resets) ---
  private _jumpJustPressed = false;
  private _shiftJustPressed = false;

  // --- Visibility ---
  private isTouchDevice: boolean;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.isTouchDevice = this.detectTouch();

    if (this.isTouchDevice) {
      // Enable extra pointers for multi-touch (Phaser default is 2)
      this.scene.input.addPointer(2); // Up to 4 total

      this.createButtons();
    }
  }

  // ========================================================
  //  Detect if this device supports touch
  // ========================================================
  private detectTouch(): boolean {
    return 'ontouchstart' in window ||
           navigator.maxTouchPoints > 0 ||
           (this.scene.sys.game.device.input.touch);
  }

  // ========================================================
  //  Create all on-screen buttons
  // ========================================================
  private createButtons(): void {
    // Scale button size relative to game canvas for responsiveness
    const scale = Math.min(WORLD.WIDTH, WORLD.HEIGHT) / 640;
    const btnSize = Math.round(56 * scale);
    const margin = Math.round(16 * scale);
    const gap = Math.round(8 * scale);

    // Left-bottom area: movement buttons
    const bottomY = WORLD.HEIGHT - margin - btnSize / 2;

    this.btnLeft = this.createButton(
      margin + btnSize / 2,
      bottomY,
      btnSize,
      '◀',
      () => { this._leftDown = true; },
      () => { this._leftDown = false; }
    );

    this.btnRight = this.createButton(
      margin + btnSize + gap + btnSize / 2,
      bottomY,
      btnSize,
      '▶',
      () => { this._rightDown = true; },
      () => { this._rightDown = false; }
    );

    // Right-bottom area: action buttons
    this.btnJump = this.createButton(
      WORLD.WIDTH - margin - btnSize / 2,
      bottomY,
      btnSize,
      '⬆',
      () => {
        this._jumpJustPressed = true;
      },
      () => { /* jump is impulse-only, no held state needed */ }
    );

    this.btnShift = this.createButton(
      WORLD.WIDTH - margin - btnSize - gap - btnSize / 2,
      bottomY,
      btnSize,
      '⇄',
      () => {
        this._shiftJustPressed = true;
      },
      () => { /* shift is impulse-only, no held state needed */ }
    );
  }

  // ========================================================
  //  Create a single touch button (container with bg + label)
  // ========================================================
  private createButton(
    x: number,
    y: number,
    size: number,
    label: string,
    onDown: () => void,
    onUp: () => void
  ): Phaser.GameObjects.Container {
    const container = this.scene.add.container(x, y);
    container.setDepth(1000); // Above everything
    container.setScrollFactor(0); // Fixed to camera
    container.setSize(size, size);
    container.setInteractive();

    // --- Background circle ---
    const bg = this.scene.add.graphics();
    bg.fillStyle(0xffffff, 0.15);
    bg.fillRoundedRect(-size / 2, -size / 2, size, size, 12);
    bg.lineStyle(2, 0x44ddff, 0.3);
    bg.strokeRoundedRect(-size / 2, -size / 2, size, size, 12);
    container.add(bg);

    // --- Label ---
    const text = this.scene.add.text(0, 0, label, {
      fontSize: `${Math.round(size * 0.45)}px`,
      fontFamily: 'monospace',
      color: '#44ddff',
    }).setOrigin(0.5).setAlpha(0.6);
    container.add(text);

    // --- Touch events ---
    // Use pointerdown/pointerup for reliable multi-touch
    container.on('pointerdown', () => {
      onDown();
      bg.clear();
      bg.fillStyle(0x44ddff, 0.35);
      bg.fillRoundedRect(-size / 2, -size / 2, size, size, 12);
      bg.lineStyle(2, 0x44ddff, 0.6);
      bg.strokeRoundedRect(-size / 2, -size / 2, size, size, 12);
      text.setAlpha(1);
    });

    container.on('pointerup', () => {
      onUp();
      bg.clear();
      bg.fillStyle(0xffffff, 0.15);
      bg.fillRoundedRect(-size / 2, -size / 2, size, size, 12);
      bg.lineStyle(2, 0x44ddff, 0.3);
      bg.strokeRoundedRect(-size / 2, -size / 2, size, size, 12);
      text.setAlpha(0.6);
    });

    container.on('pointerout', () => {
      onUp();
      bg.clear();
      bg.fillStyle(0xffffff, 0.15);
      bg.fillRoundedRect(-size / 2, -size / 2, size, size, 12);
      bg.lineStyle(2, 0x44ddff, 0.3);
      bg.strokeRoundedRect(-size / 2, -size / 2, size, size, 12);
      text.setAlpha(0.6);
    });

    return container;
  }

  // ========================================================
  //  getState — Read current input (called by Player each frame)
  // ========================================================
  getState(): TouchInputState {
    const state: TouchInputState = {
      leftDown: this._leftDown,
      rightDown: this._rightDown,
      jumpJustPressed: this._jumpJustPressed,
      shiftJustPressed: this._shiftJustPressed,
    };

    // Reset "just pressed" flags after reading — they fire only once
    this._jumpJustPressed = false;
    this._shiftJustPressed = false;

    return state;
  }

  // ========================================================
  //  isActive — Whether touch controls are being used
  // ========================================================
  isActive(): boolean {
    return this.isTouchDevice;
  }

  // ========================================================
  //  destroy — Clean up
  // ========================================================
  destroy(): void {
    this.btnLeft?.destroy();
    this.btnRight?.destroy();
    this.btnJump?.destroy();
    this.btnShift?.destroy();
  }
}
