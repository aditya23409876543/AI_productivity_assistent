// Centralized API base URL
// In production (Vercel): uses relative /api (same domain, routed to serverless)
// In local dev: uses localhost:5000
export const API = import.meta.env.VITE_API_URL || '/api';
