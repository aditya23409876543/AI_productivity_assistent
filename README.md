# AI Productivity Assistant

A premium, full-stack productivity web application featuring a stunning, responsive pastel mobile-dashboard UI. It leverages the open-source **Google Gemma** model (via Hugging Face) to prioritize tasks, summarize notes, and act as a contextual AI chat assistant.

## Features

- **Mood-Based Design System**: Dynamically swaps color palettes (Happy, Calm, Relax, Wellness) based on the user's focus mode or location in the app.
- **Smart Task Management**: Create tasks and have the AI autonomously categorize them by priority (High, Medium, Low) using Hugging Face serverless inference.
- **Intelligent Notes**: Capture markdown-friendly notes and instantly get AI-generated bulleted summaries.
- **Contextual AI Chat**: Chat natively with Gemma. The AI reads your current active tasks and provides context-aware productivity advice.
- **Live System Metrics**: The UI syncs exactly to your system's battery status, Wi-Fi connectivity, and local time to create a beautiful floating-dashboard illusion.

## Technology Stack

- **Frontend**: React, Vite, React Router, CSS Variables (Custom Theming)
- **Backend**: Node.js, Express, CORS
- **Database**: MongoDB (Mongoose)
- **AI Infrastructure**: Hugging Face Inference API (`@huggingface/inference`) utilizing `google/gemma-1.1-7b-it` (configurable).

## Setup & Running

1. **Prerequisites**
   - Node.js (v18+)
   - MongoDB cluster (Atlas or local)
   - Hugging Face Account for free API Token

2. **Environment Variables**
   Navigate to the `backend/` directory and create a `.env` file based on `.env.example`:
   ```env
   MONGODB_URI=your_mongo_db_connection_string
   HF_TOKEN=hf_your_huggingface_access_token
   PORT=5000
   ```

3. **Install Dependencies**
   ```bash
   # In frontend folder
   cd frontend
   npm install

   # In backend folder
   cd backend
   npm install
   ```

4. **Run the App Locally**
   ```bash
   # Run frontend (Vite dev server)
   cd frontend
   npm run dev

   # Run backend API
   cd backend
   node server.js
   ```

## Architecture Notes

- **Robust Fallbacks**: The application is designed to gracefully enforce database reliance. Direct DB validation prevents silent state errors.
- **Responsive Fluidity**: The frontend leverages custom CSS Grids and dynamic viewports to restrict to a clean `800px` desktop experience while retaining its core mobile-first design.
- **Clean API Parsing**: The AI engine uses resilient regex formatting wrappers to extract targeted JSON dictionaries directly from open-source unstructured instruction-tuned models.

## Evaluating AI Output

To customize the open weights model powering the intelligence, pass the `HF_MODEL` property in your backend environment configuration (`HF_MODEL=google/gemma-4-31B-it`, for example). By default, this project is optimized to run lightning fast on Hugging Face's free Serverless Inference tier using Google's `gemma-1.1-7b-it`.
