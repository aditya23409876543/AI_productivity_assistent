// Vercel Serverless Function entry point
// Wraps the Express app as a serverless handler
const app = require('../backend/server');
module.exports = app;
