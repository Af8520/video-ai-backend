const OpenAI = require('openai');
const axios = require('axios');
const fs = require('fs');
const { exec } = require('child_process');
const path = require('path');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function generateScripts(description) {
  const prompt = `You are a professional marketing copywriter. Create exactly **2 separate short ad scripts** for the following business:\n\n"${description}"\n\nEach script should be clearly separated and include multiple scenes.`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    temperature: 0.7,
    max_tokens: 800,
    messages: [
      { role: 'system', content: 'You write structured marketing video scripts' },
      { role: 'user', content: prompt }
    ]
  });

  const content = response.choices[0].message.content;
  return content.split(/\n\n+/).slice(0, 2);
}

async function breakdownToScenes(script) {
  const prompt = `Break down the following ad script into clear individual video scenes. Number them and keep each scene short and visual:\n\n"${script}"`;
  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [{ role: 'user', content: prompt }],
  });
  const content = response.choices[0].message.content;
  return content.split(/\n(?=\d+\.\s)/).map(s => s.trim());
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
