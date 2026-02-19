// ============================================================
//  AudioManager.ts — Procedural SFX with Web Audio API
// ============================================================
//
//  GAME DEV CONCEPT: Procedural Audio
//  -------------------------------------
//  Instead of loading audio files, we generate sounds in code
//  using the Web Audio API. This is how it works:
//
//  1. Create an AudioContext (the browser's sound engine)
//  2. Create oscillators (wave generators: sine, square, sawtooth)
//  3. Shape the sound with gain (volume) envelopes
//  4. Connect to speakers and play
//
//  Advantages:
//  - Zero file size (no MP3s to download)
//  - Instant: no loading phase
//  - Infinitely tweakable in code
//  - Unique sounds nobody else has!
//
//  This is how classic games (NES, Game Boy) made ALL their sounds.
//  Tools like sfxr/jsfxr popularized this approach for modern indie games.
// ============================================================

import { DIMENSIONS } from '../utils/Constants';

export class AudioManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private ambientOsc: OscillatorNode | null = null;
  private ambientGain: GainNode | null = null;

  constructor() {
    // AudioContext is created on first user interaction (browser policy)
  }

  // ========================================================
  //  Ensure AudioContext exists (must be called after user gesture)
  // ========================================================
  private ensureContext(): AudioContext | null {
    if (!this.ctx) {
      try {
        this.ctx = new AudioContext();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.3; // Master volume
        this.masterGain.connect(this.ctx.destination);
      } catch {
        // Web Audio not supported
        return null;
      }
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  // ========================================================
  //  JUMP SOUND — short rising chirp
  // ========================================================
  playJump(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(300, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.1);

    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.1);
  }

  // ========================================================
  //  LAND SOUND — short thud
  // ========================================================
  playLand(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.1);
  }

  // ========================================================
  //  SHIFT SOUND — dimensional warp whoosh
  // ========================================================
  playShift(isLumina: boolean): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;

    // Downward sweep
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(800, ctx.currentTime);
    osc1.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.2);
    gain1.gain.setValueAtTime(0.08, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
    osc1.connect(gain1);
    gain1.connect(this.masterGain);
    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.25);

    // Resonant "pop" — pitch depends on dimension
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(isLumina ? 440 : 330, ctx.currentTime + 0.05);
    osc2.frequency.exponentialRampToValueAtTime(isLumina ? 660 : 220, ctx.currentTime + 0.2);
    gain2.gain.setValueAtTime(0.12, ctx.currentTime + 0.05);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc2.connect(gain2);
    gain2.connect(this.masterGain);
    osc2.start(ctx.currentTime + 0.05);
    osc2.stop(ctx.currentTime + 0.3);
  }

  // ========================================================
  //  DAMAGE SOUND — harsh buzz
  // ========================================================
  playDamage(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(100, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(60, ctx.currentTime + 0.15);

    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.2);
  }

  // ========================================================
  //  EXIT CHIME — level complete celebration
  // ========================================================
  playExitChime(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;

    // Three ascending notes
    const notes = [523, 659, 784]; // C5, E5, G5 — major chord
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const startTime = ctx.currentTime + i * 0.12;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.15, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.4);

      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(startTime);
      osc.stop(startTime + 0.4);
    });
  }

  // ========================================================
  //  AMBIENT DRONE — continuous background tone
  // ========================================================
  startAmbient(dimension: string): void {
    this.stopAmbient();
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;

    const isLumina = dimension === DIMENSIONS.LUMINA;

    this.ambientOsc = ctx.createOscillator();
    this.ambientGain = ctx.createGain();

    this.ambientOsc.type = 'sine';
    // Lumina = warm major tone, Umbra = minor/eerie
    this.ambientOsc.frequency.setValueAtTime(isLumina ? 110 : 82.4, ctx.currentTime);

    this.ambientGain.gain.setValueAtTime(0, ctx.currentTime);
    this.ambientGain.gain.linearRampToValueAtTime(0.03, ctx.currentTime + 1);

    this.ambientOsc.connect(this.ambientGain);
    this.ambientGain.connect(this.masterGain);
    this.ambientOsc.start();
  }

  // ========================================================
  //  Crossfade ambient on dimension shift
  // ========================================================
  crossfadeAmbient(newDimension: string): void {
    const ctx = this.ensureContext();
    if (!ctx) return;

    // Fade out old, start new
    if (this.ambientGain) {
      this.ambientGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3);
    }
    if (this.ambientOsc) {
      this.ambientOsc.stop(ctx.currentTime + 0.3);
    }

    // Start new ambient after brief gap
    setTimeout(() => this.startAmbient(newDimension), 350);
  }

  stopAmbient(): void {
    try {
      if (this.ambientOsc) {
        this.ambientOsc.stop();
        this.ambientOsc.disconnect();
        this.ambientOsc = null;
      }
      if (this.ambientGain) {
        this.ambientGain.disconnect();
        this.ambientGain = null;
      }
    } catch {
      // Already stopped
    }
  }
}
