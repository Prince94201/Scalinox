import 'dotenv/config';
import express from 'express';
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import OpenAI from 'openai';

// Normalize possible misformatted .env keys with spaces
function getEnv(name) {
  return process.env[name] || process.env[`${name} `] || process.env[` ${name}`];
}

if (!getEnv('GOOGLE_GENAI_API_KEY')) {
  console.warn('[WARN] GOOGLE_GENAI_API_KEY not found. Ensure .env lines use KEY=value without spaces around =');
}
if (!getEnv('AKASH_CHAT_API_KEY')) {
  console.warn('[WARN] AKASH_CHAT_API_KEY not found. Ensure .env lines use KEY=value without spaces around =');
}

// Genkit initialization (Gemini)
export const ai = genkit({
  plugins: [googleAI({ apiKey: getEnv('GOOGLE_GENAI_API_KEY') })],
});

// Akash Chat client for prompt refinement
const akashClient = new OpenAI({
  apiKey: getEnv('AKASH_CHAT_API_KEY'),
  baseURL: 'https://chatapi.akash.network/api/v1',
});

// Supported styles mapping (pulling Scalinox client styles + legacy ones)
const stylePrompts = {
  sketch: 'Create a clean, high-quality line art rendering of the subject from the provided sketch. Keep lines confident and readable, refine proportions, and clarify forms. Use subtle variation in line weight. Background minimal. Output should look like polished concept art linework.',
  watercolor: 'Render the subject suggested by the sketch as a soft watercolor painting. Use flowing gradients, soft edges, gentle bleeding, and natural paper texture. Harmonious palette, subtle highlights, and artistic wash. Preserve composition while elevating mood and atmosphere.',
  pencil: 'Recreate the subject as a realistic graphite pencil illustration. Add fine shading, cross-hatching, and tonal depth. Emphasize form, texture, and subtle highlights. Keep it monochrome and elegant, like a finished sketchbook plate.',
  ink: 'Produce a bold black ink illustration of the subject. Crisp, confident lines with expressive brushwork. High contrast, precise contours, limited hatching for depth. Clean white background. Composition should be graphic and readable.',
  charcoal: 'Interpret the subject as a dramatic charcoal drawing. Deep shadows, rich texture, soft blending, and atmospheric edges. Focus on mood and chiaroscuro lighting. Grain of paper should be subtly visible.',
  pastel: 'Render the subject as a dreamy soft pastel artwork. Gentle chalk texture, airy gradients, warm ambient light, and a soothing palette. Soft edges with selective sharp accents. Composition remains faithful to the sketch.',
  digital: 'Create a high-fidelity digital concept art render of the subject. Sharp details, cinematic lighting, and polished finish. Subtle depth of field and professional color grading. Suitable for production artwork.',
  anime: 'Transform the subject into a classic anime-style illustration. Clean lines, expressive eyes, cel shading with crisp highlights, and vibrant colors. Dynamic but readable pose. Respect the composition while elevating style consistency.',
  cyberpunk: 'Reimagine the subject in a neon-drenched cyberpunk aesthetic. Futuristic details, holographic UI elements, neon rim lights, and moody rain-soaked ambience. High-tech textures, magenta/cyan glow, and dystopian skyline hints.',
  fantasy: 'Render the subject in an epic high-fantasy style. Magical lighting, ornate details, mythic atmosphere, and cinematic composition. Subtle particles and ethereal glow. Palette evokes wonder and adventure.'
};

const customPromptPrefix = 'Interpret the provided sketch only for composition and subject, then generate a new high-quality image that follows this user description: ';

const systemRefine = `You are an AI assistant for creative prompt engineering for image generation models.
Refine the user's prompt by adding vivid, concrete visual details about subject, setting, lighting, mood, style, composition.
Do not change the core subject. Output ONLY the refined prompt.`;

const app = express();

const explicitOrigins = (process.env.FRONTEND_ORIGINS || '').split(',').map(o => o.trim()).filter(Boolean);
const baseOrigins = ['http://localhost:5183','http://localhost:3030','http://127.0.0.1:5183','http://127.0.0.1:3030'];
const originsSet = new Set([...(explicitOrigins.length? explicitOrigins : baseOrigins)]);

app.use((req, res, next) => {
  const origin = req.headers.origin;
  let allowOrigin = null;
  if (origin) {
    if (originsSet.has(origin) || /^http:\/\/localhost:\d+$/.test(origin) || /^http:\/\/127\.0\.0\.1:\d+$/.test(origin)) {
      allowOrigin = origin;
    }
  }
  if (allowOrigin) {
    res.setHeader('Access-Control-Allow-Origin', allowOrigin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Max-Age', '600');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

app.use(express.json({ limit: '25mb' }));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', model: 'gemini-image', styles: Object.keys(stylePrompts) });
});

// Prompt refinement via Akash Chat
app.post('/refinePrompt', async (req, res) => {
  try {
    const { prompt } = req.body || {};
    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return res.status(400).json({ error: 'Prompt required' });
    }
    const response = await akashClient.chat.completions.create({
      model: 'gpt-oss-120b',
      messages: [
        { role: 'system', content: systemRefine },
        { role: 'user', content: prompt },
      ],
    });
    const refined = response.choices?.[0]?.message?.content?.trim();
    if (!refined) return res.status(502).json({ error: 'Refinement failed' });
    // If identical, append a subtle enhancement
    const finalPrompt = refined.toLowerCase() === prompt.toLowerCase().trim()
      ? `${prompt.trim()}, cinematic lighting, richly detailed, ultra high quality`
      : refined;
    res.json({ prompt: finalPrompt });
  } catch (e) {
    console.error('Refine error:', e);
    res.status(500).json({ error: 'Refine service error' });
  }
});

// Image generation using Gemini
app.post('/generate', async (req, res) => {
  try {
    const { prompt, style, imageDataUri } = req.body || {};
    const mode = (req.body && req.body.mode) === 'prompt' ? 'prompt' : 'style';

    let finalPrompt = '';
    if (mode === 'style') {
      if (!style || !stylePrompts[style]) {
        return res.status(400).json({ error: 'Unknown or missing style' });
      }
      finalPrompt = stylePrompts[style];
    } else {
      if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
        return res.status(400).json({ error: 'Prompt required for dream mode' });
      }
      finalPrompt = `${customPromptPrefix}"${prompt.trim()}"`;
    }

    const promptParts = [];
    if (imageDataUri && typeof imageDataUri === 'string' && imageDataUri.startsWith('data:')) {
      promptParts.push({ media: { url: imageDataUri } });
    }
    promptParts.push({ text: finalPrompt });

    const { media } = await ai.generate({
      model: 'googleai/gemini-2.0-flash-preview-image-generation',
      prompt: promptParts,
      config: { responseModalities: ['TEXT', 'IMAGE'] },
    });

    if (!media?.url) return res.status(502).json({ error: 'Model did not return image' });
    res.json({ imageDataUri: media.url, mode });
  } catch (e) {
    console.error('Generate error:', e);
    res.status(500).json({ error: 'Generation service error' });
  }
});

const PORT = process.env.PORT || 7003;
app.listen(PORT, () => {
  console.log(`Scalinox Gemini server running on :${PORT}`);
});
