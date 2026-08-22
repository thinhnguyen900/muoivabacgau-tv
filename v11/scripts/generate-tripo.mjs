import fs from 'node:fs/promises';
import path from 'node:path';

const [,, imagePath, outDir = 'public/character'] = process.argv;
const apiKey = process.env.TRIPO_API_KEY;
if (!imagePath) throw new Error('Usage: node scripts/generate-tripo.mjs <reference.jpg> [outDir]');
if (!apiKey) throw new Error('TRIPO_API_KEY is required');

const BASE = 'https://openapi.tripo3d.ai/v3';
const auth = { Authorization: `Bearer ${apiKey}` };
const jsonHeaders = { ...auth, 'Content-Type': 'application/json' };
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function decode(res, label) {
  const text = await res.text();
  let body;
  try { body = JSON.parse(text); } catch { body = { raw: text }; }
  if (!res.ok || (body.code != null && body.code !== 0)) {
    throw new Error(`${label}: HTTP ${res.status} ${JSON.stringify(body)}`);
  }
  return body;
}

async function postJson(endpoint, payload) {
  const res = await fetch(`${BASE}${endpoint}`, {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify(payload),
  });
  return decode(res, endpoint);
}

async function waitForTask(taskId, label, maxPolls = 240) {
  for (let i = 0; i < maxPolls; i++) {
    const res = await fetch(`${BASE}/tasks/${taskId}`, { headers: auth });
    const body = await decode(res, `${label}/poll`);
    const status = String(body.data?.status || '').toLowerCase();
    const progress = body.data?.progress ?? '';
    console.log(`[${label}] ${taskId} ${status} ${progress}`);
    if (status === 'success') return body.data;
    if (['failed', 'cancelled', 'expired', 'banned'].includes(status)) {
      throw new Error(`${label} failed: ${JSON.stringify(body.data)}`);
    }
    await sleep(3000);
  }
  throw new Error(`${label} timeout: ${taskId}`);
}

async function download(url, dest) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`download failed ${res.status}: ${url}`);
  const bytes = Buffer.from(await res.arrayBuffer());
  await fs.mkdir(path.dirname(dest), { recursive: true });
  await fs.writeFile(dest, bytes);
  return bytes.length;
}

const imageBytes = await fs.readFile(imagePath);
const ext = path.extname(imagePath).slice(1).toLowerCase() || 'jpg';
const format = ext === 'jpeg' ? 'jpg' : ext;

// Current v3 documented upload flow: presign -> PUT -> file_token.
const presign = await postJson('/files/presign', { format });
const presignedUrl = presign.data?.presigned_url;
const fileToken = presign.data?.file_token;
if (!presignedUrl || !fileToken) throw new Error(`presign fields missing: ${JSON.stringify(presign)}`);
const putRes = await fetch(presignedUrl, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/octet-stream' },
  body: imageBytes,
});
if (!putRes.ok) throw new Error(`Tripo presigned upload failed: HTTP ${putRes.status}`);

const generation = await postJson('/generation/image-to-model', {
  input: fileToken,
  model: 'v3.1-20260211',
  texture: true,
  pbr: true,
  texture_quality: 'detailed',
  enable_image_autofix: true,
  orientation: 'align_image',
  face_limit: 100000,
});
const generationTask = generation.data?.task_id;
if (!generationTask) throw new Error(`generation task_id missing: ${JSON.stringify(generation)}`);
const generated = await waitForTask(generationTask, 'image-to-model');

// v3 rig-check returns riggable + rig_type directly; it is not a long-running task.
const rigCheck = await postJson('/animations/rig-check', { input: generationTask });
const riggable = rigCheck.data?.riggable;
const rigType = rigCheck.data?.rig_type;
if (riggable === false) throw new Error(`Generated Bác Gấu is not riggable: ${JSON.stringify(rigCheck.data)}`);
if (!rigType) throw new Error(`rig-check did not return rig_type: ${JSON.stringify(rigCheck.data)}`);
if (rigType !== 'biped') {
  throw new Error(`Identity gate rejected generated model: expected anthropomorphic biped, Tripo classified ${rigType}`);
}

const rigCreate = await postJson('/animations/rig', {
  input: generationTask,
  model: 'v1.0-20240301',
  rig_type: 'biped',
  spec: 'mixamo',
  out_format: 'glb',
});
const rigTask = rigCreate.data?.task_id;
if (!rigTask) throw new Error(`rig task_id missing: ${JSON.stringify(rigCreate)}`);
const rigged = await waitForTask(rigTask, 'rig');
const modelUrl = rigged.output?.model_url || rigged.output?.model;
if (!modelUrl) throw new Error(`Rigged GLB URL missing: ${JSON.stringify(rigged.output)}`);

await fs.mkdir(outDir, { recursive: true });
const modelBytes = await download(modelUrl, path.join(outDir, 'bac-gau.glb'));
if (modelBytes < 100_000) throw new Error(`Rigged GLB suspiciously small: ${modelBytes} bytes`);

// Ask Tripo for state animation sources. Gate-1 still succeeds if animation retarget is temporarily unavailable.
const requestedAnimations = [
  'preset:biped:idle',
  'preset:biped:agree',
  'preset:biped:thinking',
  'preset:biped:happy',
  'preset:biped:wave',
];
let animationTask = null;
let animationFiles = [];
try {
  const retargetCreate = await postJson('/animations/retarget', {
    input: rigTask,
    animations: requestedAnimations,
    out_format: 'glb',
    bake_animation: true,
    export_with_geometry: true,
    animate_in_place: true,
  });
  animationTask = retargetCreate.data?.task_id || null;
  if (animationTask) {
    const retargeted = await waitForTask(animationTask, 'retarget');
    const urls = retargeted.output?.model_urls || (retargeted.output?.model_url ? [retargeted.output.model_url] : []);
    for (let i = 0; i < urls.length; i++) {
      const rel = `animations/state-${i + 1}.glb`;
      await download(urls[i], path.join(outDir, rel));
      animationFiles.push(rel);
    }
  }
} catch (error) {
  console.warn(`retarget warning: ${error.message}`);
}

await fs.writeFile(path.join(outDir, 'generation-manifest.json'), JSON.stringify({
  provider: 'tripo-v3',
  reference: 'v11.1-mature-mentor',
  characterDirection: 'mature-wise-trustworthy-adult-mentor',
  generationTask,
  rigTask,
  rigType: 'biped',
  bytes: modelBytes,
  generationCredits: generated.credits_consumed ?? null,
  rigCredits: rigged.credits_consumed ?? null,
  animationTask,
  requestedAnimations,
  animationFiles,
  generatedAt: new Date().toISOString(),
}, null, 2));

console.log(`saved ${path.join(outDir, 'bac-gau.glb')} ${modelBytes} bytes; rig=biped`);
