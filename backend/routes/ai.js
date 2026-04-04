const express = require('express');
const router = express.Router();
const { HfInference } = require('@huggingface/inference');

let hf;
if (process.env.HF_TOKEN) {
  hf = new HfInference(process.env.HF_TOKEN);
}

const AI_MODEL = process.env.HF_MODEL || 'meta-llama/Meta-Llama-3-8B-Instruct';

// Helper to call chat completion
async function aiChat(messages, max_tokens = 400) {
  const result = await hf.chatCompletion({ model: AI_MODEL, messages, max_tokens });
  return result.choices[0].message.content.trim();
}

// ── /chat ── General assistant chat with task context
router.post('/chat', async (req, res) => {
  const { message, contextTasks } = req.body;
  if (!hf) return res.status(400).json({ message: 'HF_TOKEN is not configured.' });
  try {
    const response = await aiChat([{
      role: 'user',
      content: `You are a helpful AI productivity assistant. The user has these tasks: ${JSON.stringify(contextTasks)}.\n\nUser says: "${message}"\n\nRespond helpfully and concisely.`
    }], 400);
    res.json({ response });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── /summarize ── Summarize note text into bullet points
router.post('/summarize', async (req, res) => {
  const { text } = req.body;
  if (!hf) return res.status(400).json({ message: 'HF_TOKEN is not configured.' });
  try {
    const summary = await aiChat([{
      role: 'user',
      content: `Summarize this note into concise bullet points. Be direct, no filler:\n\n${text}`
    }], 300);
    res.json({ summary });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── /insights ── NotebookLM-style deep analysis of a note
router.post('/insights', async (req, res) => {
  const { text } = req.body;
  if (!hf) return res.status(400).json({ message: 'HF_TOKEN is not configured.' });
  try {
    const prompt = `Analyze the following note and extract structured insights. Return ONLY a valid JSON object with exactly these three keys:
- "keyTopics": array of 3-5 short key topic strings from the note
- "actionItems": array of concrete action items or next steps mentioned or implied (empty array if none)
- "questions": array of 2-3 thoughtful follow-up questions an analyst would ask about this content

Do not include markdown, code fences, or any explanation outside the JSON object.

NOTE:
${text}`;

    let raw = await aiChat([{ role: 'user', content: prompt }], 400);
    raw = raw.replace(/```json/g, '').replace(/```/g, '').trim();
    // Extract first valid JSON object
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('AI did not return valid JSON insights.');
    const parsed = JSON.parse(match[0]);
    res.json({ insights: parsed });
  } catch (err) {
    console.error('Insights parse error:', err.message);
    res.status(500).json({ message: 'Failed to extract insights: ' + err.message });
  }
});

// ── /note-chat ── Chat with a specific note as the source (NotebookLM style)
router.post('/note-chat', async (req, res) => {
  const { question, noteContent, noteTitle, history = [] } = req.body;
  if (!hf) return res.status(400).json({ message: 'HF_TOKEN is not configured.' });
  try {
    // Build conversation with note as system context
    const systemContext = `You are an AI assistant helping a user understand and explore their note.

SOURCE NOTE (titled: "${noteTitle || 'Untitled'}"):
---
${noteContent}
---

Rules:
- Answer ONLY using information from the source note above.
- If the answer is not in the note, say "This isn't covered in the note, but based on general knowledge..." and answer briefly.
- Be concise and cite relevant parts of the note in your answer.
- Format answers clearly with bullet points where appropriate.`;

    const messages = [
      { role: 'user', content: systemContext + '\n\nNow answer the following question:\n' + question },
      // Include recent history (last 4 exchanges)
      ...history.slice(-4).map(m => ({ role: m.role === 'ai' ? 'assistant' : 'user', content: m.content }))
    ];

    // For history continuity, restructure properly
    const conversationMessages = [
      { role: 'user', content: systemContext },
      { role: 'assistant', content: 'Understood. I will answer questions based solely on this note. Ask me anything!' },
      ...history.slice(-6).flatMap(m => [{
        role: m.role === 'ai' ? 'assistant' : 'user',
        content: m.content
      }]),
      { role: 'user', content: question }
    ];

    const response = await aiChat(conversationMessages, 500);
    res.json({ response });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── /prioritize ── AI task prioritization  
router.post('/prioritize', async (req, res) => {
  const { tasks } = req.body;
  if (!hf) return res.status(400).json({ message: 'HF_TOKEN is not configured.' });
  try {
    const prompt = `Given these tasks: ${JSON.stringify(tasks)}, assign one of ['High', 'Medium', 'Low'] priority to each based on urgency and typical impact.
Return ONLY a valid JSON array of objects, each with 'id' (_id of the task) and 'aiPriority' (the priority string).
No explanations, greetings, or markdown. Just the raw JSON array.`;

    let raw = await aiChat([{ role: 'user', content: prompt }], 400);
    raw = raw.replace(/```json/g, '').replace(/```/g, '').trim();
    const match = raw.match(/\[[\s\S]*\]/);
    if (!match) throw new Error('AI did not return a valid JSON array.');
    const suggestedPriorities = JSON.parse(match[0]);
    res.json({ suggestedPriorities });
  } catch (err) {
    console.error('AI Parse Error:', err);
    res.status(500).json({ message: 'Failed to parse AI prioritization: ' + err.message });
  }
});

// ── /daily-plan ── Generate an AI to-do list for a given date
router.post('/daily-plan', async (req, res) => {
  const { date, scheduledEvents, existingTasks } = req.body;
  if (!hf) return res.status(400).json({ message: 'HF_TOKEN is not configured.' });
  try {
    const prompt = `You are an expert productivity planner. Generate an optimized daily to-do list for ${date}.

Scheduled events for this day:
${scheduledEvents.length > 0 ? scheduledEvents.map(e => `- ${e.time ? e.time + ' - ' : ''}${e.title} (${e.category}): ${e.description || 'No description'}`).join('\n') : 'None'}

Existing incomplete tasks:
${existingTasks.length > 0 ? existingTasks.map(t => `- ${t.title}`).join('\n') : 'None'}

Create a realistic, time-blocked daily plan. Return ONLY a valid JSON array where each item has:
- "title": string (specific, actionable task name)
- "time": string (suggested time like "09:00" or "" if flexible)
- "category": one of ["work", "personal", "health", "learning", "other"]
- "description": string (1 sentence why this task matters today)

Return 5-8 tasks. No markdown, no explanations. Just the JSON array.`;

    let raw = await aiChat([{ role: 'user', content: prompt }], 600);
    raw = raw.replace(/```json/g, '').replace(/```/g, '').trim();
    const match = raw.match(/\[[\s\S]*\]/);
    if (!match) throw new Error('AI did not return valid JSON plan.');
    const plan = JSON.parse(match[0]);
    res.json({ plan });
  } catch (err) {
    console.error('Daily plan error:', err.message);
    res.status(500).json({ message: 'Failed to generate plan: ' + err.message });
  }
});

module.exports = router;
