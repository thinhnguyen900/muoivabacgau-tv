import * as THREE from 'three';

const STATES = {
  idle: { clips: ['idle', 'standingrelax', 'wait'], caption: 'Bác Gấu đang ở đây với Muối.', smile: 0.12, timeScale: 0.86, gaze: [0, 0], head: [0.015, 0, 0] },
  welcoming: { clips: ['wave', 'wavegoodbye', 'hello'], caption: 'Muối về rồi à? Bác chào con. 👋', smile: 0.34, timeScale: 0.80, gaze: [0, 0.03], head: [-0.02, -0.03, 0.015], once: true },
  gentle: { clips: ['listen', 'agree', 'idle'], caption: 'Ừ, bác nghe đây. Con kể từ từ cũng được.', smile: 0.10, timeScale: 0.82, gaze: [-0.04, -0.10], head: [0.06, 0.03, -0.025] },
  thinking: { clips: ['think', 'scratch', 'idle'], caption: 'Hừm… câu này hay đó. Bác nghĩ một chút nha.', smile: 0.05, timeScale: 0.76, gaze: [0.16, 0.10], head: [-0.035, -0.09, 0.04] },
  playful: { clips: ['happy', 'victory', 'idle'], caption: 'Ồ, hay đó. Mình khám phá thử nhé.', smile: 0.30, timeScale: 0.90, gaze: [0.07, 0.05], head: [-0.025, 0.06, -0.035] },
};

const damp = (a, b, lambda, dt) => THREE.MathUtils.damp(a, b, lambda, dt);

export class MotionController {
  constructor(character, onCaption = () => {}) {
    this.character = character;
    this.onCaption = onCaption;
    this.state = 'idle';
    this.elapsed = 0;
    this.smile = 0.12;
    this.blinkValueL = 0;
    this.blinkValueR = 0;
    this.blinkPhase = 0;
    this.blinkEyeLead = 0;
    this.nextBlink = 2.4 + Math.random() * 2.1;
    this.nextGaze = 1.6 + Math.random() * 1.8;
    this.nextShift = 3.2 + Math.random() * 3.0;
    this.gaze = { x: 0, y: 0, tx: 0, ty: 0 };
    this.shift = { x: 0, y: 0, z: 0, tx: 0, ty: 0, tz: 0 };
  }

  setState(name) {
    const safeName = name in STATES ? name : 'idle';
    const state = STATES[safeName];
    this.state = safeName;
    this.onCaption(state.caption);
    this.character.play(state.clips, {
      fade: 0.48,
      loop: state.once ? THREE.LoopOnce : THREE.LoopRepeat,
      clamp: Boolean(state.once),
      timeScale: state.timeScale,
    });
    this.gaze.tx = state.gaze[0];
    this.gaze.ty = state.gaze[1];
    this.shift.tx = state.head[0];
    this.shift.ty = state.head[1];
    this.shift.tz = state.head[2];
    if (safeName === 'gentle') this.character.setMorph('browInnerUp', 0.24);
    else if (safeName === 'thinking') this.character.setMorph('browInnerUp', 0.12);
    else this.character.setMorph('browInnerUp', 0.05);
    return this.state;
  }

  update(dt) {
    this.elapsed += dt;
    this.nextBlink -= dt;
    this.nextGaze -= dt;
    this.nextShift -= dt;

    if (this.nextBlink <= 0 && this.blinkPhase <= 0) this._startBlink();
    if (this.nextGaze <= 0) this._chooseGaze();
    if (this.nextShift <= 0) this._chooseShift();

    this._updateBlink(dt);

    const targetSmile = STATES[this.state]?.smile ?? STATES.idle.smile;
    this.smile = damp(this.smile, targetSmile, 4.5, dt);
    this.character.setMorph('smile', this.smile);

    this.gaze.x = damp(this.gaze.x, this.gaze.tx, 5.0, dt);
    this.gaze.y = damp(this.gaze.y, this.gaze.ty, 5.0, dt);
    this.character.setGaze(this.gaze.x, this.gaze.y);

    this.shift.x = damp(this.shift.x, this.shift.tx, 2.4, dt);
    this.shift.y = damp(this.shift.y, this.shift.ty, 2.4, dt);
    this.shift.z = damp(this.shift.z, this.shift.tz, 2.4, dt);
    const breath = Math.sin(this.elapsed * 1.35) * 0.009;
    const microYaw = Math.sin(this.elapsed * 0.43 + 1.2) * 0.006;
    this.character.setHeadPose(this.shift.x + breath * 0.35, this.shift.y + microYaw, this.shift.z);
    this.character.setNeckPose(breath * 0.42, -microYaw * 0.55, -this.shift.z * 0.28);

    const shoulderBreath = Math.sin(this.elapsed * 1.35 - 0.35) * 0.006;
    this.character.setShoulders(
      { x: shoulderBreath, z: -0.012 + this.shift.z * 0.12 },
      { x: shoulderBreath * 0.92, z: 0.012 + this.shift.z * 0.10 },
    );
  }

  _startBlink() {
    this.blinkPhase = 0.001;
    this.blinkEyeLead = Math.random() < 0.5 ? -1 : 1;
    this.nextBlink = 3.0 + Math.random() * 4.1;
    if (Math.random() < 0.16) this.nextBlink = 0.55 + Math.random() * 0.42;
  }

  _updateBlink(dt) {
    if (this.blinkPhase <= 0) return;
    this.blinkPhase += dt;
    const t = this.blinkPhase;
    const close = THREE.MathUtils.smoothstep(t, 0.015, 0.085);
    const open = 1 - THREE.MathUtils.smoothstep(t, 0.105, 0.19);
    const value = Math.min(close, open);
    const asym = Math.sin(Math.min(1, t / 0.19) * Math.PI) * 0.055 * this.blinkEyeLead;
    this.blinkValueL = THREE.MathUtils.clamp(value + asym, 0, 1);
    this.blinkValueR = THREE.MathUtils.clamp(value - asym, 0, 1);
    this.character.setMorph('blinkLeft', this.blinkValueL);
    this.character.setMorph('blinkRight', this.blinkValueR);
    if (t > 0.20) {
      this.blinkPhase = 0;
      this.character.setMorph('blinkLeft', 0);
      this.character.setMorph('blinkRight', 0);
    }
  }

  _chooseGaze() {
    const state = STATES[this.state] ?? STATES.idle;
    const micro = this.state === 'gentle' ? 0.035 : 0.055;
    this.gaze.tx = THREE.MathUtils.clamp(state.gaze[0] + (Math.random() - 0.5) * micro, -0.28, 0.28);
    this.gaze.ty = THREE.MathUtils.clamp(state.gaze[1] + (Math.random() - 0.5) * micro * 0.7, -0.18, 0.18);
    this.nextGaze = 1.3 + Math.random() * 2.8;
  }

  _chooseShift() {
    const state = STATES[this.state] ?? STATES.idle;
    const amp = this.state === 'playful' ? 0.025 : this.state === 'gentle' ? 0.012 : 0.018;
    this.shift.tx = state.head[0] + (Math.random() - 0.5) * amp;
    this.shift.ty = state.head[1] + (Math.random() - 0.5) * amp * 1.2;
    this.shift.tz = state.head[2] + (Math.random() - 0.5) * amp;
    this.nextShift = 3.0 + Math.random() * 4.5;
  }
}
