/**
 * POMODORO FOCUS TIMER MODULE (timer.js)
 * =======================================
 * LEARN: Precision Web Timers, State Machines & Web Audio API
 *
 * 1. Drift-Free Timing  — Instead of relying solely on setInterval ticks (which drift when tabs are inactive),
 *                         we record `targetEndTime` and calculate `Math.round((endTime - Date.now()) / 1000)`.
 * 2. Web Audio Chimes   — Synthesizes harmonic bell tones using native AudioContext oscillators.
 *                         Zero external MP3 audio file dependencies!
 * 3. Focus Cycles       — Automates the cycle: Work (25m) -> Short Break (5m) -> Work -> Long Break (15m).
 * 4. Task Integration   — Lets users tag their active task to track focused study/work intervals.
 */

const Timer = {
  // Modes & Durations (in seconds)
  MODES: {
    pomodoro:    { label: 'Focus Work', duration: 25 * 60, color: '#7C3AED' },
    short_break: { label: 'Short Break', duration: 5 * 60,  color: '#10B981' },
    long_break:  { label: 'Long Break',  duration: 15 * 60, color: '#3B82F6' },
  },

  currentMode: 'pomodoro',
  timeLeft: 25 * 60,
  isRunning: false,
  timerInterval: null,
  targetEndTime: null,
  completedCycles: 0,
  activeTaskId: null,

  init() {
    this.restoreState();
    this.requestNotificationPermission();
    if (!this.isRunning && (!this.timeLeft || this.timeLeft <= 0)) {
      this.timeLeft = this.MODES[this.currentMode].duration;
    }
    this.updateDisplay();
  },

  requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  },

  sendSystemNotification(title, body) {
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, { body });
      } catch (e) {
        console.warn('System notification failed:', e);
      }
    }
  },

  saveState() {
    try {
      localStorage.setItem('pocketsly_timer_state', JSON.stringify({
        currentMode: this.currentMode,
        timeLeft: this.timeLeft,
        isRunning: this.isRunning,
        targetEndTime: this.targetEndTime,
        completedCycles: this.completedCycles,
        savedAt: Date.now()
      }));
    } catch (e) {}
  },

  restoreState() {
    try {
      const saved = localStorage.getItem('pocketsly_timer_state');
      if (!saved) return;
      const data = JSON.parse(saved);
      if (!data) return;

      if (this.MODES[data.currentMode]) {
        this.currentMode = data.currentMode;
      }
      this.completedCycles = Number(data.completedCycles) || 0;

      if (data.isRunning && data.targetEndTime) {
        const remainingMs = data.targetEndTime - Date.now();
        if (remainingMs > 0) {
          this.timeLeft = Math.round(remainingMs / 1000);
          this.start(true); // continue running
          return;
        } else {
          this.timeLeft = 0;
          this.onComplete(true); // session finished while the page was closed
          return;
        }
      } else {
        this.timeLeft = typeof data.timeLeft === 'number' ? data.timeLeft : this.MODES[this.currentMode].duration;
      }
    } catch (e) {
      console.warn('Could not restore timer state:', e);
    }
  },

  _audioCtx: null,

  _ensureAudioContext() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      if (!this._audioCtx) {
        this._audioCtx = new AudioCtx();
      }
      if (this._audioCtx.state === 'suspended') {
        this._audioCtx.resume();
      }
    } catch (err) {
      console.warn('AudioContext init error:', err);
    }
  },

  /** Synthesizes a gentle harmonic 2-tone chime via Web Audio API */
  playChime() {
    try {
      this._ensureAudioContext();
      if (!this._audioCtx) return;
      const ctx = this._audioCtx;
      const now = ctx.currentTime;

      // Tone 1: E5 (659.25Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(659.25, now);
      gain1.gain.setValueAtTime(0.3, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.7);

      // Tone 2: B5 (987.77Hz) harmonic
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(987.77, now + 0.18);
      gain2.gain.setValueAtTime(0.3, now + 0.18);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 1.1);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.18);
      osc2.stop(now + 1.1);
    } catch (err) {
      console.warn('Web Audio chime could not play:', err);
    }
  },

  setMode(mode) {
    if (!this.MODES[mode]) return;
    this.pause();
    this.currentMode = mode;
    this.timeLeft = this.MODES[mode].duration;
    this.targetEndTime = null;
    this.saveState();
    this.updateDisplay();
    this.renderModeButtons();
    this.updateControls();
  },

  toggle() {
    this._ensureAudioContext();
    if (this.isRunning) {
      this.pause();
    } else {
      this.start();
    }
  },

  start(isResume = false) {
    if (this.isRunning && !isResume) return;
    this._ensureAudioContext();
    this.isRunning = true;
    this.targetEndTime = Date.now() + (this.timeLeft * 1000);
    this.saveState();

    // Initial display sync
    this.updateDisplay();
    this.updateControls();

    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      if (!this.isRunning) return;
      const remainingMs = this.targetEndTime - Date.now();
      this.timeLeft = Math.max(0, Math.round(remainingMs / 1000));
      this.updateDisplay();
      this.saveState();

      if (this.timeLeft <= 0) {
        this.onComplete(false);
      }
    }, 250);
  },

  pause() {
    this.isRunning = false;
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    this.targetEndTime = null;
    this.saveState();
    this.updateDisplay();
    this.updateControls();
  },

  reset() {
    this.pause();
    this.timeLeft = this.MODES[this.currentMode].duration;
    this.targetEndTime = null;
    this.saveState();
    this.updateDisplay();
    this.updateControls();
    UI.toast(`Timer reset to ${this.MODES[this.currentMode].label} (${this.formatTime(this.timeLeft)})`, 'info');
  },

  skip() {
    this.pause();
    if (this.currentMode === 'pomodoro') {
      this.completedCycles++;
      const nextMode = (this.completedCycles % 4 === 0) ? 'long_break' : 'short_break';
      this.setMode(nextMode);
      UI.toast(`Focus session complete! Take a ${this.MODES[nextMode].label.toLowerCase()}.`, 'success');
    } else {
      this.setMode('pomodoro');
      UI.toast('Break over. Ready for your next focus session!', 'info');
    }
  },

  /** Offers to log the finished focus session to the study log. Skipped when
      the session expired while the page was closed (fromRestore), so the modal
      never pops up uninvited on page load. */
  offerStudyLog() {
    // Only called from the pomodoro branch of onComplete; note this runs AFTER
    // setMode() has switched currentMode to the break, so don't re-check it.
    if (!window.Curriculum) return;
    const hours = Math.round((this.MODES.pomodoro.duration / 3600) * 100) / 100; // 1500s -> 0.42h
    window.Curriculum.openLogStudyModal({
      hours: hours,
      notes: 'Focus session (Pomodoro)'
    });
  },

  onComplete(fromRestore = false) {
    this.pause();
    this.playChime();

    if (this.currentMode === 'pomodoro') {
      this.completedCycles++;
      const nextMode = (this.completedCycles % 4 === 0) ? 'long_break' : 'short_break';
      UI.toast(`Pomodoro completed! Cycle #${this.completedCycles}. Time for ${this.MODES[nextMode].label}.`, 'success');
      this.sendSystemNotification('Focus Session Finished!', `Pomodoro completed! Cycle #${this.completedCycles}. Time for ${this.MODES[nextMode].label}.`);
      this.setMode(nextMode);
      if (!fromRestore) this.offerStudyLog();
    } else {
      UI.toast('Break finished! Ready to focus.', 'info');
      this.sendSystemNotification('Break Finished!', 'Break finished! Ready to focus.');
      this.setMode('pomodoro');
    }
  },

  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  },

  updateDisplay() {
    const formatted = this.formatTime(this.timeLeft);

    // 1. Update Header time button
    const headerTimeEl = document.getElementById('pomo-header-time');
    if (headerTimeEl) {
      headerTimeEl.textContent = formatted;
    }

    const headerPomoBtn = document.querySelector('.header-pomo-btn');
    if (headerPomoBtn) {
      if (this.isRunning) {
        headerPomoBtn.style.borderColor = this.MODES[this.currentMode].color;
        headerPomoBtn.style.color = this.MODES[this.currentMode].color;
      } else {
        headerPomoBtn.style.borderColor = '';
        headerPomoBtn.style.color = '';
      }
    }

    // 2. Update Modal elements
    const modalTimerEl = document.getElementById('pomo-timer-display');
    const modalProgressEl = document.getElementById('pomo-progress-ring');
    const modalModeLabel = document.getElementById('pomo-mode-label');
    const modalCycleCount = document.getElementById('pomo-cycle-count');

    if (modalTimerEl) modalTimerEl.textContent = formatted;
    if (modalModeLabel) modalModeLabel.textContent = this.MODES[this.currentMode].label;
    if (modalCycleCount) modalCycleCount.textContent = `Completed Cycles: ${this.completedCycles}`;

    // SVG Circular Progress Ring Calculation
    if (modalProgressEl) {
      const total = this.MODES[this.currentMode].duration;
      const progress = total > 0 ? ((total - this.timeLeft) / total) * 100 : 0;
      modalProgressEl.setAttribute('stroke-dasharray', `${progress} 100`);
      modalProgressEl.setAttribute('stroke', this.MODES[this.currentMode].color);
    }

    // 3. Update document title if running
    if (this.isRunning) {
      document.title = `(${formatted}) ${this.MODES[this.currentMode].label} — Pocketsly`;
    } else {
      document.title = 'Pocketsly — Daily Planner & Learning Lab';
    }
  },

  updateControls() {
    const startBtn = document.getElementById('pomo-toggle-btn');
    if (startBtn) {
      startBtn.textContent = this.isRunning ? 'Pause' : 'Start Focus';
      startBtn.classList.toggle('btn-secondary', this.isRunning);
      startBtn.classList.toggle('btn-primary', !this.isRunning);
    }
  },

  renderModeButtons() {
    document.querySelectorAll('.pomo-tab-btn').forEach(btn => {
      const mode = btn.getAttribute('data-mode');
      btn.classList.toggle('active', mode === this.currentMode);
    });
  },

  openModal() {
    this._ensureAudioContext();
    const overlay = document.getElementById('pomo-modal-overlay');
    if (overlay) {
      document.body.classList.add('modal-open');
      overlay.classList.remove('hidden');
      this.updateDisplay();
      this.updateControls();
      this.renderModeButtons();
    }
  },

  closeModal() {
    const overlay = document.getElementById('pomo-modal-overlay');
    if (overlay) {
      document.body.classList.remove('modal-open');
      overlay.classList.add('hidden');
    }
  }
};

document.addEventListener('DOMContentLoaded', () => Timer.init());
