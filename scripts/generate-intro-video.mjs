import fs from 'node:fs/promises';
import path from 'node:path';

const [envPath, imagePath, outputPath] = process.argv.slice(2);
if (!envPath || !imagePath || !outputPath) {
  throw new Error('Usage: node scripts/generate-intro-video.mjs <env> <image> <output>');
}

function parseEnv(source) {
  return Object.fromEntries(source.split(/\r?\n/).flatMap((line) => {
    const match = line.match(/^\s*([^#=\s]+)\s*=\s*(.*)\s*$/);
    if (!match) return [];
    const value = match[2].replace(/^(['"])(.*)\1$/, '$2');
    return [[match[1], value]];
  }));
}

async function jsonRequest(url, init, context) {
  const response = await fetch(url, init);
  const body = await response.text();
  if (!response.ok) throw new Error(`${context} failed (${response.status}): ${body.slice(0, 500)}`);
  return body ? JSON.parse(body) : {};
}

const env = parseEnv(await fs.readFile(envPath, 'utf8'));
const apiKey = env.HIGGSFIELD_API_KEY || env.HF_API_KEY || env.HF_CREDENTIALS;
if (!apiKey) throw new Error('Higgsfield API key is missing in the provided .env file.');

const image = await fs.readFile(imagePath);
const authHeaders = { Authorization: `Key ${apiKey}`, 'Content-Type': 'application/json' };

console.log('Requesting a private upload target…');
const upload = await jsonRequest('https://api.higgsfield.ai/files/generate-upload-url', {
  method: 'POST',
  headers: authHeaders,
  body: JSON.stringify({ content_type: 'image/png' })
}, 'Upload URL request');

const uploadHeaders = new Headers(upload.upload_headers || {});
if (!uploadHeaders.has('content-type')) uploadHeaders.set('content-type', 'image/png');
const uploadResponse = await fetch(upload.upload_url, { method: 'PUT', headers: uploadHeaders, body: image });
if (!uploadResponse.ok) throw new Error(`Image upload failed (${uploadResponse.status}).`);

console.log('Starting 5-second cloud animation…');
const generation = await jsonRequest('https://api.higgsfield.ai/wan/v2.7/image-to-video', {
  method: 'POST',
  headers: authHeaders,
  body: JSON.stringify({
    image_url: upload.public_url,
    duration: 5,
    resolution: '720p',
    prompt_extend: false,
    prompt: 'Static camera. The soft pastel cloud masses slowly and elegantly part horizontally: clouds on the left drift left, clouds on the right drift right, opening a bright dreamy passage in the center. Preserve the original ivory, blush and lavender palette and the detailed cloud texture. Smooth gentle motion, no zoom, no camera shake, no rotation, no text, no people, no objects.',
    negative_prompt: 'camera movement, zoom, rotation, flicker, text, people, birds, buildings, new objects, dark colors, hard cuts, distorted clouds'
  })
}, 'Video generation');

const statusUrl = generation.status_url || `https://api.higgsfield.ai/requests/${generation.request_id}/status`;
const startedAt = Date.now();
let status = generation;
while (!['completed', 'failed', 'nsfw', 'canceled'].includes(status.status)) {
  if (Date.now() - startedAt > 15 * 60 * 1000) throw new Error('Video generation timed out.');
  await new Promise((resolve) => setTimeout(resolve, 7000));
  status = await jsonRequest(statusUrl, { headers: { Authorization: `Key ${apiKey}` } }, 'Status request');
  console.log(`Generation status: ${status.status || 'processing'}`);
}

if (status.status !== 'completed' || !status.video?.url) {
  throw new Error(`Video generation ended with status: ${status.status || 'unknown'}`);
}

const videoResponse = await fetch(status.video.url);
if (!videoResponse.ok) throw new Error(`Video download failed (${videoResponse.status}).`);
await fs.mkdir(path.dirname(outputPath), { recursive: true });
await fs.writeFile(outputPath, Buffer.from(await videoResponse.arrayBuffer()));
console.log(`Saved animated intro (${Math.round((await fs.stat(outputPath)).size / 1024)} KiB).`);
