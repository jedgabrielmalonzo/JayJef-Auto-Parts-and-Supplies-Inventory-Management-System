/**
 * Web Audio API Sound Service for Inventory Alert Signals
 * Plays attention-grabbing alert chimes when products drop below reorder threshold or run out of stock.
 * Uses Web Audio API synthesizers - 100% offline, zero network latency, no external mp3 assets needed.
 */

class SoundService {
  constructor() {
    this.ctx = null;
    this.enabled = typeof window !== 'undefined' ? localStorage.getItem('jayjef_audio_alerts') !== 'false' : true;
  }

  initContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  isAudioEnabled() {
    return this.enabled;
  }

  setAudioEnabled(state) {
    this.enabled = !!state;
    if (typeof window !== 'undefined') {
      localStorage.setItem('jayjef_audio_alerts', this.enabled ? 'true' : 'false');
    }
    if (this.enabled) {
      this.initContext();
      this.playTestBeep();
    }
  }

  /** Quick feedback test sound when user toggles audio alerts on */
  playTestBeep() {
    try {
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now); // D5 tone
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.2);
    } catch (e) {
      console.warn('Audio feedback error:', e);
    }
  }

  /**
   * Warning chime for low stock (P1 limit reached)
   * 2-tone pleasant rising chime: E5 (659Hz) -> G5 (784Hz)
   */
  playLowStockAlert() {
    if (!this.enabled) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;

      // Note 1: E5
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(659.25, now);
      gain1.gain.setValueAtTime(0.2, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc1.connect(gain1);
      gain1.connect(this.ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.25);

      // Note 2: G5
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(783.99, now + 0.15);
      gain2.gain.setValueAtTime(0.25, now + 0.15);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

      osc2.connect(gain2);
      gain2.connect(this.ctx.destination);
      osc2.start(now + 0.15);
      osc2.stop(now + 0.5);
    } catch (e) {
      console.warn('Low stock sound error:', e);
    }
  }

  /**
   * Urgent alarm for complete stockout (0 units remaining)
   * Dual-tone descending alarm: A5 (880Hz) -> D5 (587Hz)
   */
  playStockoutAlert() {
    if (!this.enabled) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;

      // Pulse 1
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(880, now);
      osc1.frequency.linearRampToValueAtTime(587.33, now + 0.18);
      gain1.gain.setValueAtTime(0.3, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      osc1.connect(gain1);
      gain1.connect(this.ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.3);

      // Pulse 2
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(880, now + 0.22);
      osc2.frequency.linearRampToValueAtTime(440, now + 0.45);
      gain2.gain.setValueAtTime(0.3, now + 0.22);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

      osc2.connect(gain2);
      gain2.connect(this.ctx.destination);
      osc2.start(now + 0.22);
      osc2.stop(now + 0.55);
    } catch (e) {
      console.warn('Stockout sound error:', e);
    }
  }

  /**
   * Helper function: Checks new stock level against reorder threshold and plays appropriate sound
   */
  checkAndPlayAlert(newQuantity, reorderThreshold = 5) {
    const qty = Number(newQuantity);
    const threshold = Number(reorderThreshold);

    if (qty === 0) {
      this.playStockoutAlert();
      return 'stockout';
    } else if (qty <= threshold) {
      this.playLowStockAlert();
      return 'low_stock';
    }
    return 'healthy';
  }
}

export const soundService = new SoundService();
