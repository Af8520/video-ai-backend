const OpenAI = require('openai');
const axios = require('axios');
const fs = require('fs');
const { exec } = require('child_process');
const path = require('path');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function generateScriptsByLanguage(lang, description) {
  const prompts = {
    en: {
      system: "You write engaging, short, structured video scripts for ads.",
      user: `You are a professional video scriptwriter. Write 2 short ad scripts for a business described as: "${description}"

Instructions:
- Each script should include 3–5 short scenes.
- Each scene should be clearly numbered (e.g., Scene 1, Scene 2) and described visually.
- Separate each script with a clear header like "SCRIPT 1" and "SCRIPT 2".
- Be concise and creative. Assume the video will be 30–45 seconds long.`
    },
    he: {
      system: "אתה כותב תסריטים קצרים, שיווקיים וברורים לסרטוני וידאו.",
      user: `כתוב 2 תסריטים קצרים עבור עסק מסוג: "${description}"

הנחיות:
- כל תסריט יכיל 3–5 סצנות ממוספרות (1, 2, 3 וכו’)
- כל סצנה תתאר תמונה או פעולה בצורה חזותית
- הפרד בין התסריטים בעזרת כותרת כמו "תסריט 1" ו"תסריט 2"
- כתוב בעברית פשוטה וברורה כאילו הסרטון באורך חצי דקה`
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

  const content = response.choices[0].message.content;

  // פיצול לפי "SCRIPT" או "תסריט" בהתאם לשפה
  const splitRegex = lang === 'he' ? /תסריט\s?\d/gi : /SCRIPT\s?\d/gi;

  return content.split(splitRegex).map(s => s.trim()).filter(s => s.length > 0);
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
  const splitRegex = lang === 'he' ? /\n(?=\d+\.\s)/ : /\n(?=Scene\s?\d)/i;

  return content.split(splitRegex).map(s => s.trim());
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
  // Placeholder – replace with actual Ideogram API integration
  const mockUrl = `https://api.ideogram.ai/generate?prompt=${encodeURIComponent(imagePrompt)}`;
  return mockUrl;
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
  generateScripts,
  breakdownToScenes,
  generateImagePrompt,
  generateVideoPrompt,
  generateImage,
  generateVideo,
  mergeVideos
};
