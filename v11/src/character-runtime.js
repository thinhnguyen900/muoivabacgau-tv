import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const REQUIRED_BONE_HINTS = ['hips', 'spine', 'head', 'leftarm', 'rightarm', 'leftleg', 'rightleg'];
const FACIAL_ALIASES = {
  jawOpen: ['jawopen', 'mouthopen', 'viseme_aa', 'aa'],
  smile: ['mouthsmileleft', 'mouthsmileright', 'smile', 'happy'],
  blinkLeft: ['eyeblinkleft', 'blink_left', 'blinkleft'],
  blinkRight: ['eyeblinkright', 'blink_right', 'blinkright'],
  browInnerUp: ['browinnerup', 'browraise', 'browsup'],
  browDownLeft: ['browdownleft', 'browlowerleft'],
  browDownRight: ['browdownright', 'browlowerright'],
};
const BONE_ALIASES = {
  head: ['head'], neck: ['neck'], chest: ['spine2', 'chest', 'upperchest'], spine: ['spine1', 'spine'], hips: ['hips', 'pelvis'],
  shoulderLeft: ['leftshoulder', 'shoulderl'], shoulderRight: ['rightshoulder', 'shoulderr'],
  armLeft: ['leftarm', 'upperarml', 'arml'], armRight: ['rightarm', 'upperarmr', 'armr'],
  forearmLeft: ['leftforearm', 'lowerarml', 'forearml'], forearmRight: ['rightforearm', 'lowerarmr', 'forearmr'],
  handLeft: ['lefthand', 'handl'], handRight: ['righthand', 'handr'],
  eyeLeft: ['lefteye', 'eyel'], eyeRight: ['righteye', 'eyer'], jaw: ['jaw'],
};
const normalize = s => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
const clamp11 = v => THREE.MathUtils.clamp(v, -1, 1);

function materialRole(obj, material) {
  const key = normalize(`${obj?.name || ''} ${material?.name || ''}`);
  if (/eye|iris|pupil|cornea/.test(key)) return 'eye';
  if (/nose|nostril/.test(key)) return 'nose';
  if (/mouth|lip|tongue|gum|teeth|tooth/.test(key)) return 'mouth';
  if (/fur|hair|coat|body|head|face|muzzle|cheek|ear|arm|hand|torso/.test(key)) return 'fur';
  return 'generic';
}

function tuneMaterial(obj, material) {
  if (!material) return;
  const role = materialRole(obj, material);
  material.dithering = true;
  if ('metalness' in material) material.metalness = Math.min(material.metalness ?? 0, 0.025);
  if ('envMapIntensity' in material) material.envMapIntensity = Math.min(material.envMapIntensity ?? 1, role === 'eye' ? 0.95 : 0.62);
  if ('roughness' in material) {
    const current = material.roughness ?? 0.72;
    const targets = { eye: 0.28, nose: 0.46, mouth: 0.58, fur: 0.82, generic: 0.72 };
    material.roughness = role === 'eye' ? Math.min(current, targets.eye) : Math.max(current, targets[role]);
  }
  if ('clearcoat' in material) {
    material.clearcoat = role === 'eye' ? Math.max(material.clearcoat ?? 0, 0.25) : Math.min(material.clearcoat ?? 0, 0.06);
    material.clearcoatRoughness = role === 'eye' ? 0.18 : 0.8;
  }
  if ('normalScale' in material && material.normalScale?.isVector2 && role === 'fur') material.normalScale.multiplyScalar(0.72);
  if (material.map) material.map.colorSpace = THREE.SRGBColorSpace;
  material.needsUpdate = true;
}

export class CharacterRuntime {
  constructor({ scene, onStatus = () => {} }) {
    this.scene = scene;
    this.onStatus = onStatus;
    this.root = null;
    this.mixer = null;
    this.actions = new Map();
    this.morphs = new Map();
    this.bones = new Map();
    this.controls = new Map();
    this.bind = new Map();
    this.ready = false;
    this.bounds = null;
  }

  async load(url) {
    this.onStatus('Đang tải mesh + rig thật…');
    const gltf = await new GLTFLoader().loadAsync(url);
    this.root = gltf.scene;
    this.root.traverse(obj => {
      obj.frustumCulled = false;
      if (obj.isMesh) {
        obj.castShadow = true;
        obj.receiveShadow = true;
        const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
        for (const material of materials) tuneMaterial(obj, material);
      }
      if (obj.isBone) {
        const key = normalize(obj.name);
        this.bones.set(key, obj);
        this.bind.set(obj.uuid, { rotation: obj.rotation.clone(), position: obj.position.clone() });
      }
      if (obj.morphTargetDictionary) {
        for (const [name, index] of Object.entries(obj.morphTargetDictionary)) {
          this.morphs.set(normalize(name), { mesh: obj, index, name });
        }
      }
    });
    this._resolveControls();
    this._fitToStage();
    this.scene.add(this.root);
    this.mixer = new THREE.AnimationMixer(this.root);
    for (const clip of gltf.animations) this.actions.set(normalize(clip.name), this.mixer.clipAction(clip));
    this.ready = true;
    const report = this.inspect();
    this.onStatus(`Rigged GLB ✓ · ${report.bones} bones · ${report.morphTargets} morphs · ${report.clips} clips`);
    return report;
  }

  _resolveControls() {
    for (const [role, aliases] of Object.entries(BONE_ALIASES)) {
      const aliasKeys = aliases.map(normalize);
      let hit = null;
      for (const [name, bone] of this.bones) {
        if (aliasKeys.some(alias => name === alias || name.endsWith(alias) || name.includes(alias))) { hit = bone; break; }
      }
      if (hit) this.controls.set(role, hit);
    }
  }

  _fitToStage() {
    const box = new THREE.Box3().setFromObject(this.root);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const targetHeight = 4.75;
    const scale = targetHeight / Math.max(size.y, .001);
    this.root.scale.setScalar(scale);
    this.root.position.set(-center.x * scale, -box.min.y * scale, -center.z * scale);
    this.root.updateMatrixWorld(true);
    this.bounds = new THREE.Box3().setFromObject(this.root);
  }

  inspect() {
    const names = [...this.bones.keys()];
    const missingBones = REQUIRED_BONE_HINTS.filter(h => !names.some(n => n.includes(h)));
    const facial = {};
    for (const [role, aliases] of Object.entries(FACIAL_ALIASES)) facial[role] = aliases.some(a => this.morphs.has(normalize(a)));
    return {
      bones: this.bones.size,
      morphTargets: this.morphs.size,
      clips: this.actions.size,
      controls: [...this.controls.keys()],
      missingBones,
      facial,
      bounds: this.bounds ? this.bounds.getSize(new THREE.Vector3()).toArray().map(v => Number(v.toFixed(3))) : null,
    };
  }

  findAction(candidates = []) {
    for (const c of candidates) {
      const key = normalize(c);
      for (const [name, action] of this.actions) if (name.includes(key)) return action;
    }
    return null;
  }

  play(candidates, { fade = .28, loop = THREE.LoopRepeat, clamp = false, timeScale = 1 } = {}) {
    if (!this.mixer) return false;
    const next = this.findAction(candidates);
    if (!next) return false;
    for (const action of this.actions.values()) if (action !== next && action.isRunning()) action.fadeOut(fade);
    next.reset().setLoop(loop, loop === THREE.LoopOnce ? 1 : Infinity);
    next.clampWhenFinished = clamp;
    next.timeScale = timeScale;
    next.fadeIn(fade).play();
    return true;
  }

  setMorph(role, value) {
    const aliases = FACIAL_ALIASES[role] || [role];
    let hit = false;
    for (const alias of aliases) {
      const entry = this.morphs.get(normalize(alias));
      if (entry) {
        entry.mesh.morphTargetInfluences[entry.index] = THREE.MathUtils.clamp(value, 0, 1);
        hit = true;
      }
    }
    return hit;
  }

  setBonePose(role, { x = 0, y = 0, z = 0 } = {}, strength = 1) {
    const bone = this.controls.get(role);
    const neutral = bone && this.bind.get(bone.uuid);
    if (!bone || !neutral) return false;
    const s = THREE.MathUtils.clamp(strength, 0, 1);
    bone.rotation.x = neutral.rotation.x + clamp11(x) * s;
    bone.rotation.y = neutral.rotation.y + clamp11(y) * s;
    bone.rotation.z = neutral.rotation.z + clamp11(z) * s;
    return true;
  }

  setGaze(x = 0, y = 0) {
    const yaw = clamp11(x) * 0.085;
    const pitch = clamp11(y) * 0.06;
    const left = this.setBonePose('eyeLeft', { x: pitch, y: yaw }, 1);
    const right = this.setBonePose('eyeRight', { x: pitch, y: yaw }, 1);
    if (!(left || right)) this.setBonePose('head', { x: pitch * 0.18, y: yaw * 0.18 }, 1);
    return left || right;
  }

  setHeadPose(x = 0, y = 0, z = 0) { return this.setBonePose('head', { x, y, z }, 1); }
  setNeckPose(x = 0, y = 0, z = 0) { return this.setBonePose('neck', { x, y, z }, 1); }
  setShoulders(left = {}, right = {}) { this.setBonePose('shoulderLeft', left, 1); this.setBonePose('shoulderRight', right, 1); }
  setArms(left = {}, right = {}) { this.setBonePose('armLeft', left, 1); this.setBonePose('armRight', right, 1); }

  update(dt) { this.mixer?.update(dt); }
}
