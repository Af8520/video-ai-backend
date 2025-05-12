const express = require('express');
const router = express.Router();
const {
  generateScriptsByLanguage,
  breakdownToScenes,
  generateImagePrompt,
  generateVideoPrompt,
  generateVideoPromptsForImages,
  generateImage,
  generateImagesForScenes,
  generateVideo,
  generateVideoViaMake,
  mergeVideos
} = require('../services/scriptService');

router.post('/generate-scripts', async (req, res) => {
  const { description, lang = 'en' } = req.body;
  try {
    const scripts = await generateScriptsByLanguage(lang, description);
    res.json({ scripts });
  } catch (error) {
    console.error('Error in /generate-scripts:', error);
    res.status(500).json({ error: 'Failed to generate scripts' });
  }
});


router.post('/breakdown-scenes', async (req, res) => {
  const { selectedScript, lang = 'en' } = req.body;
  try {
    const scenes = await breakdownToScenes(selectedScript, lang);
    res.json({ scenes });
  } catch (error) {
    res.status(500).json({ error: 'Failed to breakdown script into scenes' });
  }
});

router.post('/generate-image-prompt', async (req, res) => {
  const { sceneText } = req.body;
  try {
    const prompt = await generateImagePrompt(sceneText);
    res.json({ prompt });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate image prompt' });
  }
});

router.post('/generate-video-prompt', async (req, res) => {
  const { imageDescription } = req.body;
  try {
    const prompt = await generateVideoPrompt(imageDescription);
    res.json({ prompt });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate video prompt' });
  }
});

router.post('/generate-video-prompts', async (req, res) => {
  const { images } = req.body;

  if (!images || !Array.isArray(images)) {
    return res.status(400).json({ error: 'Missing images array' });
  }

  try {
    const videoData = await generateVideoPromptsForImages(images);
    res.json({ videos: videoData });
  } catch (error) {
    console.error('❌ Failed generating video prompts:', error);
    res.status(500).json({ error: 'Video prompt generation failed' });
  }
});


router.post('/generate-image', async (req, res) => {
  const { sceneText } = req.body;
  try {
    const imagePrompt = await generateImagePrompt(sceneText);
    const imageUrl = await generateImage(imagePrompt);
    res.json({ imageUrl, prompt: imagePrompt });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate image' });
  }
});

router.post('/generate-images', async (req, res) => {
  const { scenes } = req.body;

  if (!scenes || !Array.isArray(scenes)) {
    return res.status(400).json({ error: 'Missing scenes array' });
  }

  try {
    const images = await generateImagesForScenes(scenes);
    res.json({ images });
  } catch (error) {
    console.error('❌ Failed generating images:', error);
    res.status(500).json({ error: 'Image generation failed' });
  }
});

router.post('/generate-video', async (req, res) => {
  const { imageDescription, imageUrl } = req.body;
  try {
    const videoPrompt = await generateVideoPrompt(imageDescription);
    const videoUrl = await generateVideoViaMake(imageUrl, videoPrompt);
    console.log('🎬 Video URL from Make:', videoUrl);
    res.json({ videoUrl, prompt: videoPrompt });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate video' });
  }
});


router.post('/merge-videos', async (req, res) => {
  const { videoPaths, outputName } = req.body;
  try {
    const mergedPath = await mergeVideos(videoPaths, outputName);
    res.json({ mergedPath });
  } catch (error) {
    res.status(500).json({ error: 'Failed to merge videos' });
  }
});

module.exports = router;
