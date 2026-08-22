import fs from 'node:fs/promises';
import path from 'node:path';

const [,, imagePath, outDir = 'public/character'] = process.argv;
const apiKey = process.env.TRIPO_API_KEY;
if (!imagePath) throw new Error('Usage: node scripts/generate-tripo.mjs <reference.jpg> [outDir]');
if (!apiKey) throw new Error('TRIPO_API_KEY is required');

const BASE = 'https://openapi.tripo3d.ai/v3';
const auth = { Authorization: `Bearer ${apiKey}` };
const jsonHeaders = { ...auth, 'Content-Type': 'application/json' };

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
    await new Promise(resolve => setTimeout(resolve, 3000));
    const res = await fetch(`${BASE}/tasks/${taskId}`, { headers: auth });
    const body = await decode(res, `${label}/poll`);
    const status = String(body.data?.status || '').toLowerCase();
    const progress = body.data?.progress ?? '';
    console.log(`[${label}] ${taskId} ${status} ${progress}`);
    if (status === 'success') return body.data;
    if (['failed', 'cancelled', 'expired', 'banned'].includes(status)) {
      throw new Error(`${label} failed: ${JSON.stringify(body.data)}`);
    }
  }
  throw new Error(`${label} timeout: ${taskId}`);
}

// V3 file upload. This removes the brittle v2 image_token/file_token ambiguity.
const bytes = await fs.readFile(imagePath);
const mime = path.extname(imagePath).toLowerCase() === '.png' ? 'image/png' : 'image/jpeg';
const form = new FormData();
form.append('file', new Blob([bytes], { type: mime }), path.basename(imagePath));
const uploadRes = await fetch(`${BASE}/files`, { method: 'POST', headers: auth, body: form });
const upload = await decode(uploadRes, 'file-upload');
const fileToken = upload.data?.file_token;
if (!fileToken) throw new Error(`Tripo v3 file_token missing: ${JSON.stringify(upload)}`);

// Detailed PBR generation is the visual-quality gate. Keep the approved mature reference as source.
const generation = await postJson('/generation/image-to-model', {
  input: fileToken,
  model: 'v3.1-20260211',
  texture: true,
  pbr: true,
  texture_quality: 'detailed',
  enable_image_autofix: true,
  orientation: 'align_image',
});
const generationTask = generation.data?.task_id;
if (!generationTask) throw new Error(`generation task_id missing: ${JSON.stringify(generation)}`);
const generated = await waitForTask(generationTask, 'image-to-model');

// Never guess biped/quadruped: use Tripo's own rig-check result.
const rigCheckCreate = await postJson('/animations/rig-check', { input: generationTask });
const rigCheckTask = rigCheckCreate.data?.task_id;
if (!rigCheckTask) throw new Error(`rig-check task_id missing: ${JSON.stringify(rigCheckCreate)}`);
const rigCheck = await waitForTask(rigCheckTask, 'rig-check');
const riggable = rigCheck.output?.riggable;
const rigType = rigCheck.output?.rig_type;
if (!riggable || !rigType) {
  throw new Error(`Generated bear is not riggable: ${JSON.stringify(rigCheck.output)}`);
}

const rigCreate = await postJson('/animations/rig', {
  input: generationTask,
  model: rigType === 'biped' ? 'v1.0-20240301' : 'v2.5-20260210',
  rig_type: rigType,
  spec: 'mixamo',
  out_format: 'glb',
});
const rigTask = rigCreate.data?.task_id;
if (!rigTask) throw new Error(`rig task_id missing: ${JSON.stringify(rigCreate)}`);
const rigged = await waitForTask(rigTask, 'rig');
const modelUrl = rigged.output?.model_url || rigged.output?.model;
if (!modelUrl) throw new Error(`Rigged GLB URL missing: ${JSON.stringify(rigged.output)}`);

const modelRes = await fetch(modelUrl);
if (!modelRes.ok) throw new Error(`GLB download failed: HTTP ${modelRes.status}`);
const model = Buffer.from(await modelRes.arrayBuffer());
if (model.length < 100_000) throw new Error(`Rigged GLB suspiciously small: ${model.length} bytes`);

await fs.mkdir(outDir, { recursive: true });
await fs.writeFile(path.join(outDir, 'bac-gau.glb'), model);
await fs.writeFile(path.join(outDir, 'generation-manifest.json'), JSON.stringify({
  provider: 'tripo-v3',
  reference: 'v11.1-mature-mentor',
  generationTask,
  rigCheckTask,
  rigTask,
  rigType,
  bytes: model.length,
  generationCredits: generated.credits_consumed ?? null,
  rigCredits: rigged.credits_consumed ?? null,
  generatedAt: new Date().toISOString(),
}, null, 2));
console.log(`saved ${path.join(outDir, 'bac-gau.glb')} ${model.length} bytes; rig=${rigType}`);
