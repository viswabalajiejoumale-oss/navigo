import express from 'express';
import cors from 'cors';
import axios from 'axios';
import dotenv from 'dotenv';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Python executable path (venv)
const PYTHON_PATH = path.join(__dirname, '..', '.venv', 'Scripts', 'python.exe');

// Helper function to call Python
function callPythonGemini(prompt, language, userProfile, transportMode, expenses, appContext) {
  return new Promise((resolve, reject) => {
    const pythonProcess = spawn(PYTHON_PATH, [
      path.join(__dirname, 'gemini_handler.py'),
      JSON.stringify({
        prompt,
        language,
        userProfile,
        transportMode,
        expenses,
        appContext
      })
    ]);

    let output = '';
    let errorOutput = '';

    pythonProcess.stdout.on('data', (data) => {
      output += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    pythonProcess.on('close', (code) => {
      if (code === 0) {
        try {
          const result = JSON.parse(output);
          resolve(result.response);
        } catch (e) {
          reject(new Error(`Failed to parse Python response: ${output}`));
        }
      } else {
        reject(new Error(`Python error: ${errorOutput}`));
      }
    });

    pythonProcess.on('error', reject);
  });
}

// Gemini endpoint
app.post('/gemini', async (req, res) => {
  try {
    const { text, language, userProfile, currentTransportMode, expenses, appContext } = req.body;

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return res.status(400).json({ error: 'Text is required' });
    }

    const sanitizedText = text.trim().substring(0, 1000);
    const sanitizedLanguage = (language || 'en').substring(0, 10);

    console.log(`📨 Chat request: "${sanitizedText}" | Language: ${sanitizedLanguage}`);

    // Call Python Gemini handler
    const response = await callPythonGemini(
      sanitizedText,
      sanitizedLanguage,
      userProfile || {},
      currentTransportMode || '',
      expenses || [],
      appContext || {}
    );

    console.log(`✅ Response: "${response.substring(0, 100)}..."`);

    res.json({ response });
  } catch (error) {
    console.error('❌ Gemini Error:', error.message);
    res.status(500).json({
      error: 'Failed to process request',
      details: error.message,
      debug: process.env.NODE_ENV === 'development'
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
});

