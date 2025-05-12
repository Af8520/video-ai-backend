const express = require('express');
const router = express.Router();
const {
  generateScriptsByLanguage,
  breakdownToScenes,
  generateImagePrompt,
  generateVideoPrompt,
  generateImage,
  generateVideo,
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

router.post('/generate-video', async (req, res) => {
  const { imageDescription, imageUrl } = req.body;
  try {
    const videoPrompt = await generateVideoPrompt(imageDescription);
    const videoUrl = await generateVideo(imageUrl, videoPrompt);
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
