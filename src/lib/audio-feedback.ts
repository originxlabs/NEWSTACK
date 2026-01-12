// Audio feedback utility for pipeline notifications
// Uses Web Audio API to generate simple tones

class AudioFeedback {
  private audioContext: AudioContext | null = null;

  private getContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return this.audioContext;
  }

  // Play a success tone (ascending notes)
  playSuccess(): void {
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;

      // Play 3 ascending notes for success
      this.playNote(ctx, 523.25, now, 0.15, 0.3); // C5
      this.playNote(ctx, 659.25, now + 0.12, 0.15, 0.3); // E5
      this.playNote(ctx, 783.99, now + 0.24, 0.25, 0.4); // G5
    } catch (e) {
      console.warn("Audio feedback not available:", e);
    }
  }

  // Play an error/warning tone (descending notes)
  playError(): void {
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;

      // Play 2 descending notes for error
      this.playNote(ctx, 440, now, 0.2, 0.4, "square"); // A4
      this.playNote(ctx, 330, now + 0.2, 0.3, 0.4, "square"); // E4
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
