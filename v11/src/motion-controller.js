import * as THREE from 'three';

const STATES = {
  idle: {
    clips: ['idle', 'standingrelax', 'wait'],
    caption: 'Bác Gấu đang ở đây với Muối.',
    smile: 0.12,
    timeScale: 0.86,
  },
  welcoming: {
    clips: ['wave', 'wavegoodbye', 'hello'],
    caption: 'Muối về rồi à? Bác chào con. 👋',
    smile: 0.34,
    timeScale: 0.80,
    once: true,
  },
  gentle: {
    clips: ['listen', 'agree', 'idle'],
    caption: 'Ừ, bác nghe đây. Con kể từ từ cũng được.',
    smile: 0.10,
    timeScale: 0.82,
  },
  thinking: {
    clips: ['think', 'scratch', 'idle'],
    caption: 'Hừm… câu này hay đó. Bác nghĩ một chút nha.',
    smile: 0.05,
    timeScale: 0.76,
  },
  playful: {
    clips: ['happy', 'victory', 'idle'],
    caption: 'Ồ, hay đó. Mình khám phá thử nhé.',
    smile: 0.30,
    timeScale: 0.90,
  },
};

export class MotionController {
  constructor(character, onCaption = () => {}) {
    this.character = character;
    this.onCaption = onCaption;
    this.state = 'idle';
    this.blinkT = 2.8;
    this.elapsed = 0;
    this.smile = 0.12;
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
    return this.state;
  }

  update(dt) {
    this.elapsed += dt;
    this.blinkT -= dt;
    if (this.blinkT <= 0) {
      this.blinkT = 3.2 + Math.random() * 3.8;
      this._blink();
    }

    const targetSmile = STATES[this.state]?.smile ?? STATES.idle.smile;
    this.smile = THREE.MathUtils.damp(this.smile, targetSmile, 4.5, dt);
    this.character.setMorph('smile', this.smile);
  }

  _blink() {
    this.character.setMorph('blinkLeft', 1);
    this.character.setMorph('blinkRight', 1);
    setTimeout(() => {
      this.character.setMorph('blinkLeft', 0);
      this.character.setMorph('blinkRight', 0);
    }, 150);
  }
}
