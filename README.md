# Video AI Backend

This is a Node.js/Express backend that accepts user prompts, generates scripts using OpenAI, breaks them into scenes, generates images and videos using AI, and merges them into one final video.

## How to deploy on Render

1. Go to [https://render.com](https://render.com) and sign in.
2. Click **New Web Service**.
3. Connect your GitHub repo or upload this zip as a repo.
4. Set:
   - Environment: **Node**
   - Build Command: `npm install`
   - Start Command: `npm start`
5. Add an Environment Variable:  
   `OPENAI_API_KEY=your_api_key_here`
6. Deploy and use your URL (e.g., `https://your-app.onrender.com/api/generate-scripts`)

Health check: `GET /health`
