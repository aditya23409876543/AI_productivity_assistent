# 🚀 Deploying to Render via Docker

This guide explains how to deploy the backend of the **AI Productivity Assistant** to [Render](https://render.com) using our new Docker configuration.

---

## 📋 Prerequisites

Before deploying, make sure you have:
1. A **MongoDB Atlas** connection string (e.g., `mongodb+srv://...`).
2. A **Hugging Face** API token (for AI functionality) with access to the configured model (default is `meta-llama/Meta-Llama-3-8B-Instruct`).
3. A **GitHub** repository containing your code.

---

## 🛠️ Step-by-Step Render Deployment

### 1. Create a New Web Service on Render
1. Log in to your [Render Dashboard](https://dashboard.render.com).
2. Click the **New +** button and select **Web Service**.
3. Connect your GitHub repository containing the **AI Productivity Assistant** code.

### 2. Configure Service Settings
When setting up your service, configure the following fields:

* **Name:** `ai-productivity-assistant-backend` (or your preferred name)
* **Region:** Choose the region closest to your users (e.g., `Oregon (US West)` or `Frankfurt (EU Central)`)
* **Branch:** `main` (or your active branch)
* **Root Directory:** Leave blank (or keep as `.` default). Render will automatically find the `Dockerfile` at the root of the repository.
* **Runtime:** `Docker` (Render will automatically detect this since the Dockerfile is in the root directory)

### 3. Add Environment Variables
Scroll down to the **Environment Variables** section and add the following keys:

| Key | Value | Description |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | Sets the application to production mode |
| `PORT` | `5000` | The port that the container will expose and Render will route traffic to |
| `MONGODB_URI` | `your_mongodb_connection_string` | Your production MongoDB database URL |
| `HF_TOKEN` | `your_hugging_face_token` | Hugging Face API key for AI-powered tasks and insights |
| `HF_MODEL` | `meta-llama/Meta-Llama-3-8B-Instruct` | *(Optional)* Override the default Hugging Face AI model |

---

## 🔗 Connecting your Frontend (Vercel) to Render

Once your backend is deployed, Render will provide you with a public URL, such as `https://ai-productivity-assistant-backend.onrender.com`.

To connect your Vercel frontend to this backend:
1. Go to your **Vercel** dashboard and navigate to your project.
2. Go to **Settings** > **Environment Variables**.
3. Add or update the variable `VITE_API_URL`:
   * **Key:** `VITE_API_URL`
   * **Value:** `https://ai-productivity-assistant-backend.onrender.com/api` (replace with your actual Render URL, appending `/api`)
4. Redeploy your Vercel project to apply the new environment variable.

---

## 🔍 Troubleshooting & Logs

* **Health Check Fails:** Render automatically monitors your service to ensure it starts properly. The backend includes a root endpoint `/` that returns `{"status": "AI Productivity Assistant API is running"}`. This acts as an automatic health check for Render.
* **Database Connection Issues:** Make sure your MongoDB Atlas cluster has IP Whitelisting set to allow connections from anywhere (`0.0.0.0/0`), as Render's server IPs can be dynamic.
