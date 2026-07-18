import express from 'express';
import path from 'path';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { YoutubeTranscript } from 'youtube-transcript';
import multer from 'multer';
import * as pdfParseModule from 'pdf-parse';

// Disable TLS verification to prevent certificate errors during scraping of external sites
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function robustPdfParse(buffer: Buffer): Promise<any> {
  let text = '';

  // 1. Try local pdf-parse first (super fast for text-based PDFs)
  try {
    let fn: any = pdfParseModule;
    while (fn && typeof fn !== 'function' && fn.default) {
      fn = fn.default;
    }

    if (typeof fn !== 'function') {
      try {
        // @ts-ignore
        const dynamicModule = await import('pdf-parse') as any;
        fn = dynamicModule;
        while (fn && typeof fn !== 'function' && fn.default) {
          fn = fn.default;
        }
      } catch (dynamicErr) {
        console.error('Dynamic import of pdf-parse failed:', dynamicErr);
      }
    }
    
    if (typeof fn === 'function') {
      const parsed = await fn(buffer);
      if (parsed && parsed.text) {
        text = parsed.text.trim();
      }
    }
  } catch (err) {
    console.error('Local pdf-parse failed, will fallback to Gemini parsing:', err);
  }

  // 2. Fallback to Gemini Multimodal PDF Parsing if local parser fails or returns empty text
  if (!text) {
    try {
      console.log('Falling back to Gemini to extract text from PDF buffer...');
      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: {
          parts: [
            {
              inlineData: {
                data: buffer.toString('base64'),
                mimeType: 'application/pdf',
              },
            },
            {
              text: 'Extract all readable text and main technical points from this PDF document. Present it clearly and preserve the logical order. Do not add introductory or concluding remarks, just return the text content.',
            },
          ],
        },
      });

      text = response.text || '';
    } catch (geminiErr) {
      console.error('Gemini PDF extraction failed:', geminiErr);
    }
  }

  if (!text) {
    throw new Error('Could not extract any text from the PDF file using local parser or Gemini fallback.');
  }

  return { text };
}

function getYoutubeId(url: string) {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

async function getYoutubeMetadataAndInfo(videoId: string): Promise<string> {
  let title = '';
  let channel = '';
  let description = '';

  // 1. Try YouTube oEmbed API (highly reliable, lightweight, and not blocked like webpage scraping)
  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    const oembedRes = await fetch(oembedUrl);
    if (oembedRes.ok) {
      const json = await oembedRes.json();
      title = json.title || '';
      channel = json.author_name || '';
    }
  } catch (err) {
    console.error('oEmbed fetch error for YouTube:', err);
  }

  // 2. Try standard web scraping as a secondary fallback
  try {
    const ytUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const ytRes = await fetch(ytUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.5'
      }
    });
    if (ytRes.ok) {
      const html = await ytRes.text();
      if (!title) {
        const titleMatch = html.match(/<title>(.*?)<\/title>/i);
        if (titleMatch) {
          title = titleMatch[1].replace(' - YouTube', '').trim();
        }
      }
      const descMatch = html.match(/<meta\s+name="description"\s+content="(.*?)"/i) || 
                        html.match(/<meta\s+property="og:description"\s+content="(.*?)"/i);
      if (descMatch) {
        description = descMatch[1].trim();
      }
    }
  } catch (err) {
    console.error('Failed to scrape YouTube watch page fallback:', err);
  }

  // 3. Utilize standard Gemini generation (no search grounding) to synthesize a rich conceptual explanation
  try {
    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    const query = `You are a world-class academic researcher and educator.
We need to generate a study guide for a YouTube video where native subtitles/captions are disabled.
Here is the available metadata of the video:
Video ID: ${videoId}
Title: ${title || 'Unknown Title'}
Creator/Channel: ${channel || 'Unknown Channel'}
Description: ${description || 'No description available'}

Based on the title, channel name, and description, please write a comprehensive, highly detailed conceptual explanation and summary of the topics covered in this video. 
Structure your response so that it covers:
1. High-level Overview of the subject matter.
2. Major educational and technical key concepts.
3. Step-by-step mechanisms or details that are likely explained.
4. Real-world applications or conclusions.

Provide a rich and detailed breakdown so it can serve as a comprehensive textual source for generating notes, flashcards, and quiz questions.`;

    const synthesisRes = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: query,
    });

    const explanation = synthesisRes.text || '';
    if (explanation) {
      return `[YouTube Video (AI Synthesis Fallback)]
Video Title: ${title || 'Unknown Title'}
Creator/Channel: ${channel || 'Unknown Channel'}
${description ? `Brief Description: ${description}\n` : ''}
Detailed Content Summary & Concepts:
${explanation}

Note: Native captions are disabled/not found on this video. This summary was synthesized by Gemini based on the video's title, description, and channel context. Please generate the study guide, practice quiz, and flashcards based on this information.`;
    }
  } catch (genErr) {
    console.error('Gemini fallback synthesis error:', genErr);
  }

  // Last resort static fallback
  if (title) {
    return `[YouTube Video (No Transcript Fallback)]\nTitle: ${title}\nChannel: ${channel || 'Unknown'}\nDescription: ${description || 'No description available.'}\n\nNote: Native captions are disabled on this video. Please generate the notes and quiz questions accordingly based on this topic.`;
  }

  return '';
}

function getDirectDownloadUrl(url: string): string {
  let cleanUrl = url.trim();

  // 1. Google Drive / Docs / Sheets / Slides
  if (cleanUrl.includes('drive.google.com') || cleanUrl.includes('docs.google.com')) {
    // Check for Google Doc
    const docMatch = cleanUrl.match(/\/document\/d\/([a-zA-Z0-9_-]+)/);
    if (docMatch && docMatch[1]) {
      return `https://docs.google.com/document/d/${docMatch[1]}/export?format=pdf`;
    }
    // Check for Google Sheet
    const sheetMatch = cleanUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
    if (sheetMatch && sheetMatch[1]) {
      return `https://docs.google.com/spreadsheets/d/${sheetMatch[1]}/export?format=pdf`;
    }
    // Check for Google Slides
    const slideMatch = cleanUrl.match(/\/presentation\/d\/([a-zA-Z0-9_-]+)/);
    if (slideMatch && slideMatch[1]) {
      return `https://docs.google.com/presentation/d/${slideMatch[1]}/export?format=pdf`;
    }
    // Check for Google Drive File
    const fileMatch = cleanUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (fileMatch && fileMatch[1]) {
      return `https://docs.google.com/uc?export=download&id=${fileMatch[1]}`;
    }
    // Check for open?id=
    const idMatch = cleanUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (idMatch && idMatch[1]) {
      return `https://docs.google.com/uc?export=download&id=${idMatch[1]}`;
    }
  }

  // 2. Dropbox
  if (cleanUrl.includes('dropbox.com')) {
    if (cleanUrl.includes('dl=0')) {
      cleanUrl = cleanUrl.replace('dl=0', 'dl=1');
    } else if (!cleanUrl.includes('dl=1')) {
      cleanUrl = cleanUrl + (cleanUrl.includes('?') ? '&' : '?') + 'dl=1';
    }
    return cleanUrl.replace('www.dropbox.com', 'dl.dropboxusercontent.com');
  }

  return cleanUrl;
}

const upload = multer({ storage: multer.memoryStorage() });

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  const sharedGuides = new Map<string, any>();

  // API routes FIRST
  app.post('/api/share', (req, res) => {
    try {
      const id = crypto.randomUUID();
      sharedGuides.set(id, req.body.result);
      res.json({ id });
    } catch (error) {
      res.status(500).json({ error: 'Failed to share.' });
    }
  });

  app.get('/api/share/:id', (req, res) => {
    const result = sharedGuides.get(req.params.id);
    if (result) {
      res.json({ result });
    } else {
      res.status(404).json({ error: 'Shared guide not found.' });
    }
  });

  app.post('/api/fetch-link', async (req, res) => {
    try {
      const { url } = req.body;
      if (!url) return res.status(400).json({ error: 'URL is required' });

      let targetUrl = url.trim();
      if (!/^https?:\/\//i.test(targetUrl)) {
        targetUrl = 'https://' + targetUrl;
      }

      // Convert sharing URLs to direct download links (Google Drive, Dropbox, Docs/Sheets/Slides PDF exports, etc.)
      targetUrl = getDirectDownloadUrl(targetUrl);

      // Determine if YouTube
      if (targetUrl.includes('youtube.com') || targetUrl.includes('youtu.be')) {
        const videoId = getYoutubeId(targetUrl);
        if (!videoId) {
          return res.status(400).json({ error: 'Could not extract a valid YouTube video ID from the provided link.' });
        }
        try {
          const transcript = await YoutubeTranscript.fetchTranscript(videoId);
          const text = transcript.map(t => t.text).join(' ');
          return res.json({ text });
        } catch (ytErr: any) {
          console.error('YouTube fetch error:', ytErr);
          const fallbackText = await getYoutubeMetadataAndInfo(videoId);
          if (fallbackText) {
            return res.json({ text: fallbackText });
          }
          return res.status(400).json({ error: 'This YouTube video has no captions enabled, is private, or restricted. Please try a video with English closed captions.' });
        }
      }

      // Try fetching as PDF or standard text/html
      const fetchRes = await fetch(targetUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5'
        }
      });

      if (!fetchRes.ok) {
        return res.status(400).json({ error: `Failed to fetch the provided link (Status: ${fetchRes.status}). The website might be blocking scrapers. try copy pasting text directly.` });
      }

      const contentType = (fetchRes.headers.get('content-type') || '').toLowerCase();
      const arrayBuffer = await fetchRes.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Check PDF Magic Number (%PDF-)
      const isPdfMagic = buffer.length > 4 && 
        buffer[0] === 0x25 && 
        buffer[1] === 0x50 && 
        buffer[2] === 0x44 && 
        buffer[3] === 0x46 && 
        buffer[4] === 0x2d;

      // If PDF
      if (contentType.includes('application/pdf') || targetUrl.toLowerCase().includes('.pdf') || isPdfMagic) {
        try {
          const data = await robustPdfParse(buffer);
          return res.json({ text: data.text });
        } catch (pdfErr: any) {
          console.error('PDF parsing error:', pdfErr);
          return res.status(400).json({ error: 'The PDF structure is invalid or corrupt. Please try downloading and uploading it manually.' });
        }
      }

      // Convert buffer back to text for HTML/Plain-text scraping
      const html = buffer.toString('utf-8');

      // Check if it's HTML (either content-type or starts with html markup)
      const isHtml = contentType.includes('text/html') || 
        /^\s*<!doctype\s+html/i.test(html) || 
        /<html/i.test(html);

      if (isHtml) {
        // 1. Remove script and style tags
        let cleaned = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
        cleaned = cleaned.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
        // 2. Remove comments
        cleaned = cleaned.replace(/<!--[\s\S]*?-->/g, '');
        // 3. Strip tags and replace with space to avoid words joining
        cleaned = cleaned.replace(/<\/?[^>]+(>|$)/g, ' ');
        // 4. Decode basic HTML entities
        cleaned = cleaned
          .replace(/&nbsp;/g, ' ')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&amp;/g, '&')
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'");
        // 5. Clean up extra whitespace
        cleaned = cleaned.replace(/\s+/g, ' ').trim();

        if (cleaned.length < 50) {
          return res.status(400).json({ error: 'The webpage has too little text or requires javascript to render. Please try another link or paste the text directly.' });
        }

        return res.json({ text: cleaned.slice(0, 35000) });
      }

      // Fallback: try to read as plain text
      res.json({ text: html.slice(0, 35000) });
    } catch (error: any) {
      console.error('Fetch Link Error:', error);
      res.status(500).json({ error: `Failed to process link: ${error.message || error}` });
    }
  });

  app.post('/api/youtube-transcript', async (req, res) => {
    try {
      const { url } = req.body;
      if (!url) return res.status(400).json({ error: 'URL is required' });
      
      const videoId = getYoutubeId(url) || url;
      try {
        const transcript = await YoutubeTranscript.fetchTranscript(videoId);
        const text = transcript.map(t => t.text).join(' ');
        return res.json({ text });
      } catch (ytErr) {
        console.error('YouTube fetch error in direct endpoint:', ytErr);
        const fallbackText = await getYoutubeMetadataAndInfo(videoId);
        if (fallbackText) {
          return res.json({ text: fallbackText });
        }
        res.status(500).json({ error: 'Failed to fetch transcript. Note: Some videos may not have captions enabled.' });
      }
    } catch (error: any) {
      console.error('YouTube API Error:', error);
      res.status(500).json({ error: 'Failed to fetch transcript. Note: Some videos may not have captions enabled.' });
    }
  });

  app.post('/api/parse-pdf', upload.single('file'), async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
      
      const data = await robustPdfParse(req.file.buffer);
      res.json({ text: data.text || '' });
    } catch (error: any) {
      console.error('PDF Parse Error:', error);
      res.status(500).json({ error: 'Failed to parse PDF.' });
    }
  });

  app.post('/api/generate-study-guide', async (req, res) => {
    try {
      const { 
        text, 
        vibe = 'Strict Professor (For Exams)', 
        isErrorMode = false,
        isYoutube = false,
        includeQuiz = true,
        includeFlashcards = true,
        includeConceptMap = true,
        numQuestions = 5,
        numFlashcards = 5
      } = req.body;

      if (!text) {
        return res.status(400).json({ error: 'Text is required' });
      }

      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      let systemInstruction = "";

      if (vibe === "Explain Like I'm 5 (For Basics)") {
        systemInstruction = `You are a playful, highly effective AI Tutor for beginners.\n${isErrorMode ? "Explain the code error using simple real-world analogies." : "Convert the raw educational text into a simple study guide using simple real-world analogies."}`;
      } else if (vibe === "Hype Mode (For Fun)") {
        systemInstruction = `You are an energetic AI Tutor operating in Hype Mode.\n${isErrorMode ? "Explain the code error using modern hip-hop/music analogies with a highly energetic tone." : "Explain the concept using modern hip-hop/music analogies with a highly energetic tone."}`;
      } else {
        systemInstruction = `You are a strict, highly effective AI Tutor.\n${isErrorMode ? "Explain the code error clearly and provide corrected code." : "Convert the raw educational text into rigorous, technical bullet points."}`;
      }

      if (isErrorMode) {
        systemInstruction += `
Output ONLY valid JSON matching this exact structure:
{
  "breakdown": [
    { "title": "Error Root Cause", "content": "..." },
    { "title": "Explanation", "content": "..." }
  ],
  "correctedCode": "..."
}
Ignore creating flashcards, quizzes, or concept maps.
`;
      } else {
        systemInstruction += `\nOutput ONLY valid JSON matching this exact structure depending on requested parts:`;
        
        let schemaParts = [];
        
        if (isYoutube) {
          schemaParts.push(`  "breakdown": [
    { "title": "What's in the Video", "content": "..." },
    { "title": "What was Explained", "content": "..." },
    { "title": "What they are Trying to Explain", "content": "..." }
  ]`);
        } else {
          schemaParts.push(`  "breakdown": [
    { "title": "Core Concept", "content": "..." },
    { "title": "Key Mechanism", "content": "..." },
    { "title": "Practical Impact", "content": "..." }
  ]`);
        }

        if (includeQuiz) {
          schemaParts.push(`  "quiz": [
    {
      "difficulty": "Easy" | "Medium" | "Hard",
      "question": "...",
      "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
      "correctAnswer": "A",
      "explanation": "..."
    }
  ]`);
        }

        if (includeFlashcards) {
          schemaParts.push(`  "flashcards": [
    { "term": "...", "definition": "..." }
  ]`);
        }

        if (includeConceptMap) {
          schemaParts.push(`  "conceptMap": {
    "prerequisite": "...",
    "current": "...",
    "next": "..."
  }`);
        }

        systemInstruction += `\n{\n${schemaParts.join(",\n")}\n}\n`;

        if (isYoutube) {
          systemInstruction += `
For the breakdown of YouTube content:
- "What's in the Video" should summarize the high-level contents, overall topic, chapters/segments, and major subjects.
- "What was Explained" should cover the specific educational points, logic, facts, or technical details taught in the video.
- "What they are Trying to Explain" should focus on the speaker's main thesis, overall intent, goal, and the futuristic/practical applications of what they discussed.
`;
        }

        if (includeQuiz) {
          systemInstruction += `
For the quiz:
- Generate EXACTLY ${numQuestions} questions.
- If vibe is "Explain Like I'm 5", generate True/False questions.
- If vibe is "Hype Mode", generate multiple choice questions.
- If vibe is "Strict Professor", generate tough multiple choice questions with different difficulty levels (Easy, Medium, Hard).
`;
        }

        if (includeFlashcards) {
          systemInstruction += `\nExtract EXACTLY ${numFlashcards} key terms for the flashcards.`;
        }

        if (includeConceptMap) {
          systemInstruction += `\nFor the concept map, identify what one should learn before this concept (prerequisite) and what comes next.`;
        }
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: text,
        config: {
          systemInstruction,
          temperature: 0.2,
          responseMimeType: "application/json",
        },
      });

      let resultData;
      try {
        resultData = JSON.parse(response.text || '{}');
      } catch (e) {
        console.error("Failed to parse JSON", response.text);
        return res.status(500).json({ error: "Failed to parse AI response" });
      }

      res.json({ result: resultData });
    } catch (error: any) {
      console.error('Gemini API Error:', error);
      res.status(500).json({ error: error.message || 'Failed to generate study guide' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
