// Audio feedback utility for pipeline notifications
// Uses Web Audio API to generate simple tones

const STORAGE_KEY = "audio-feedback-muted";

class AudioFeedback {
  private audioContext: AudioContext | null = null;
  private _isMuted: boolean = false;
  private _volume: number = 0.3;
  private listeners: Set<() => void> = new Set();

  constructor() {
    // Load muted state from localStorage
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored !== null) {
        this._isMuted = stored === "true";
      }
    }
  }

  get isMuted(): boolean {
    return this._isMuted;
  }

  set isMuted(value: boolean) {
    this._isMuted = value;
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, String(value));
    }
    this.notifyListeners();
  }

  get volume(): number {
    return this._volume;
  }

  set volume(value: number) {
    this._volume = Math.max(0, Math.min(1, value));
    this.notifyListeners();
  }

  toggleMute(): void {
    this.isMuted = !this.isMuted;
  }

  subscribe(callback: () => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notifyListeners(): void {
    this.listeners.forEach(cb => cb());
  }

  private getContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return this.audioContext;
  }

  // Play a success tone (ascending notes)
  playSuccess(): void {
    if (this._isMuted) return;
    
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;

      // Play 3 ascending notes for success
      this.playNote(ctx, 523.25, now, 0.15, this._volume); // C5
      this.playNote(ctx, 659.25, now + 0.12, 0.15, this._volume); // E5
      this.playNote(ctx, 783.99, now + 0.24, 0.25, this._volume * 1.2); // G5
    } catch (e) {
      console.warn("Audio feedback not available:", e);
    }
  }

  // Play an error/warning tone (descending notes)
  playError(): void {
    if (this._isMuted) return;
    
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;

      // Play 2 descending notes for error
      this.playNote(ctx, 440, now, 0.2, this._volume * 1.2, "square"); // A4
      this.playNote(ctx, 330, now + 0.2, 0.3, this._volume * 1.2, "square"); // E4
    } catch (e) {
      console.warn("Audio feedback not available:", e);
    }
  }

  // Play a single note
  private playNote(
    ctx: AudioContext,
    frequency: number,
    startTime: number,
    duration: number,
    volume: number = 0.3,
    waveType: OscillatorType = "sine"
  ): void {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.type = waveType;
    oscillator.frequency.setValueAtTime(frequency, startTime);

    // Envelope for smooth sound
    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.start(startTime);
    oscillator.stop(startTime + duration + 0.1);
  }
}

export const audioFeedback = new AudioFeedback();
