const OpenAI = require('openai');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const { exec } = require('child_process');
const path = require('path');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function generateScriptsByLanguage(lang, description) {
  const prompts = {
    en: {
      system: "You write structured ad scripts and return them as JSON.",
      user: `Write 2 short marketing video scripts for a business: "${description}"

Return the result in the following JSON format:

{
  "scripts": [
    {
      "title": "Script 1",
      "scenes": [
        "Scene 1: ...",
        "Scene 2: ...",
        "Scene 3: ..."
      ]
    },
    {
      "title": "Script 2",
      "scenes": [
        "Scene 1: ...",
        "Scene 2: ...",
        "Scene 3: ..."
      ]
    }
  ]
}

- Each scene should be short and visually described
- Limit to 3–5 scenes per script
- Do NOT include explanations or text outside the JSON object.`
    },
    he: {
      system: "אתה מחזיר תסריטים שיווקיים כתובים בפורמט JSON בלבד.",
      user: `כתוב 2 תסריטים שיווקיים קצרים לעסק: "${description}"

החזר תשובה בפורמט JSON בלבד כך:

{
  "scripts": [
    {
      "title": "תסריט 1",
      "scenes": ["סצנה 1: ...", "סצנה 2: ..."]
    },
    {
      "title": "תסריט 2",
      "scenes": ["סצנה 1: ...", "סצנה 2: ..."]
    }
  ]
}

- אל תכתוב הסברים או טקסט חיצוני – רק JSON תקני
- כל סצנה צריכה להיות קצרה ותיאורית`
    }
  };

  const p = prompts[lang] || prompts.en;

  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    temperature: 0.7,
    max_tokens: 1000,
    messages: [
      { role: 'system', content: p.system },
      { role: 'user', content: p.user }
    ]
  });

  const rawContent = response.choices[0].message.content;

  // מנסה לפענח JSON מתוך התשובה
  try {
    const parsed = JSON.parse(rawContent);
    return parsed.scripts || [];
  } catch (err) {
    console.error('⚠️ Failed to parse JSON from GPT:', err);
    return [];
  }
}


async function breakdownToScenes(script, lang = 'en') {
  const prompt = lang === 'he'
    ? `פצל את התסריט הבא לסצנות ממוספרות לפי הפורמט: 1. 2. 3. כל סצנה תהיה תיאור קצר וויזואלי:\n\n"${script}"`
    : `Break down the following ad script into clearly numbered short scenes (Scene 1, Scene 2, etc.):\n\n"${script}"`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      { role: 'system', content: 'You split scripts into numbered visual scenes' },
      { role: 'user', content: prompt }
    ]
  });

  const content = response.choices[0].message.content;

  // פיצול לפי כותרות סצנה (עברית או אנגלית)
  const splitRegex = lang === 'he'
    ? /\n(?=\d+\.\s)/
    : /\n(?=Scene\s?\d)/i;

  return content
    .split(splitRegex)
    .map(s => s.trim())
    .filter(s => /^(\d+\.\s|Scene\s?\d)/i.test(s)); // מחזיר רק שורות שמתחילות בסצנה
}



async function generateImagePrompt(sceneText) {
  const prompt = `Describe the following scene in a single sentence suitable for AI image generation (Ideogram):\n\n"${sceneText}"`;
  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [{ role: 'user', content: prompt }],
  });
  return response.choices[0].message.content.trim();
}

async function generateVideoPrompt(imageDescription) {
  const prompt = `Convert the following image description into a short video generation prompt for Runway, including camera movement and visual effects:\n\n"${imageDescription}"`;
  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [{ role: 'user', content: prompt }],
  });
  return response.choices[0].message.content.trim();
}


async function generateImage(imagePrompt) {
  const form = new FormData();
  form.append('prompt', imagePrompt);
  form.append('rendering_speed', 'TURBO'); // אפשר גם DEFAULT או QUALITY

  try {
    const response = await axios.post(
      'https://api.ideogram.ai/v1/ideogram-v3/generate',
      form,
      {
        headers: {
          ...form.getHeaders(),
          'Api-Key': process.env.IDEOGRAM_API_KEY // שים את המפתח ב־.env שלך
        }
      }
    );

    const imageUrl = response.data.data[0].url;
    return imageUrl;
  } catch (error) {
    console.error('🛑 Ideogram API Error:', error.response?.data || error.message);
    throw new Error('Image generation failed');
  }
}

async function generateImagesForScenes(scenes) {
  const results = [];

  for (const sceneText of scenes) {
    try {
      const imagePrompt = await generateImagePrompt(sceneText);
      const imageUrl = await generateImage(imagePrompt);
      results.push({ sceneText, prompt: imagePrompt, imageUrl });
    } catch (error) {
      console.error(`❌ Error generating image for scene: "${sceneText}"`, error.message);
      results.push({ sceneText, error: true });
    }
  }

  return results;
}


async function generateVideo(imageUrl, videoPrompt) {
  // Placeholder – replace with actual Runway API integration
  const mockUrl = `https://api.runwayml.com/generate?image=${encodeURIComponent(imageUrl)}&prompt=${encodeURIComponent(videoPrompt)}`;
  return mockUrl;
}

async function mergeVideos(videoPaths, outputName = 'final_output.mp4') {
  const tempListPath = path.join(__dirname, 'video_list.txt');
  const fileListContent = videoPaths.map(p => `file '${p}'`).join('\n');
  fs.writeFileSync(tempListPath, fileListContent);

  const outputPath = path.join(__dirname, '..', 'output', outputName);
  return new Promise((resolve, reject) => {
    exec(`ffmpeg -f concat -safe 0 -i ${tempListPath} -c copy ${outputPath}`, (error, stdout, stderr) => {
      if (error) return reject(error);
      resolve(outputPath);
    });
  });
}

module.exports = {
  generateScriptsByLanguage,
  breakdownToScenes,
  generateImagePrompt,
  generateVideoPrompt,
  generateImage,
  generateImagesForScenes,
  generateVideo,
  mergeVideos
};
