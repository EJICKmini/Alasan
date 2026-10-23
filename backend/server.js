const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { createWorker } = require('tesseract.js');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const vision = require('@google-cloud/vision');
const sharp = require('sharp');
const pdf = require('pdf-poppler');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('uploads'));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only PDF and image files are allowed'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Initialize Google Cloud Vision client
let visionClient = null;
try {
  const visionCredentials = process.env.GOOGLE_CLOUD_VISION_KEY
    ? JSON.parse(process.env.GOOGLE_CLOUD_VISION_KEY)
    : undefined;
  visionClient = new vision.ImageAnnotatorClient(
    visionCredentials ? { credentials: visionCredentials } : {}
  );
  console.log('Google Cloud Vision API initialized successfully');
} catch (error) {
  console.log('Google Cloud Vision API not available, using Tesseract.js only');
}

// Initialize Gemini AI using environment variables
const geminiApiKey = process.env.GEMINI_API_KEY;
if (!geminiApiKey) {
  console.error('Gemini API key not found in environment variables');
}

const genAI = new GoogleGenerativeAI(geminiApiKey);
console.log('Gemini AI initialized with API key:', geminiApiKey ? 'Available' : 'Not available');

// Function to convert PDF to images
async function convertPdfToImages(pdfPath) {
  try {
    const outputDir = path.dirname(pdfPath);
    const options = {
      format: 'png',
      out_dir: outputDir,
      out_prefix: path.basename(pdfPath, '.pdf'),
      page: null // Convert all pages
    };
    
    console.log('Converting PDF to images...');
    const result = await pdf.convert(pdfPath, options);
    console.log('PDF converted to images:', result);
    
    // Return the first page image path
    const firstPagePath = path.join(outputDir, `${path.basename(pdfPath, '.pdf')}-1.png`);
    return firstPagePath;
  } catch (error) {
    console.error('PDF conversion error:', error);
    throw new Error('Failed to convert PDF to image');
  }
}

// OCR function using Google Cloud Vision API or Tesseract.js
async function performOCR(filePath, useGoogleVision = true) {
  try {
    let imagePath = filePath;
    
    // Check if file is PDF and convert to image
    if (path.extname(filePath).toLowerCase() === '.pdf') {
      console.log('PDF detected, converting to image first...');
      imagePath = await convertPdfToImages(filePath);
    }
    
    // Try Google Cloud Vision API first if available
    if (useGoogleVision && visionClient) {
      console.log('Using Google Cloud Vision API for OCR');
      const [result] = await visionClient.textDetection(imagePath);
      const detections = result.textAnnotations;
      if (detections && detections.length > 0) {
        // Clean up converted image if it was created
        if (imagePath !== filePath && fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
        return detections[0].description;
      }
    }
    
    // Fallback to Tesseract.js
    console.log('Using Tesseract.js for OCR');
    const worker = await createWorker('eng');
    
    const { data: { text } } = await worker.recognize(imagePath);
    
    await worker.terminate();
    
    // Clean up converted image if it was created
    if (imagePath !== filePath && fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }
    
    return text;
  } catch (error) {
    console.error('OCR Error:', error);
    
    // Clean up converted image if it was created
    if (imagePath !== filePath && fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }
    
    // If Google Vision fails, try Tesseract.js as fallback
    if (useGoogleVision && visionClient) {
      console.log('Google Vision failed, falling back to Tesseract.js');
      return performOCR(filePath, false);
    }
    
    throw new Error('Failed to extract text from document');
  }
}

// Gemini analysis function
async function analyzeWithGemini(text) {
  try {
    console.log('Starting Gemini analysis...');
    console.log('Text length:', text.length);
    console.log('Text preview:', text.substring(0, 200) + '...');
    
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const prompt = `You are analyzing a legal or business document.
Task: Identify and highlight important sections.
Criteria: 
1. Legal terminology and binding clauses.
2. Dates, deadlines, and time limits.
3. Names of parties, organizations, or identifiers.
4. Financial amounts, payments, or penalties.
5. NDA/confidentiality or intellectual property mentions.
6. Termination, liability, and risk allocation.
7. Signature lines, initials, or stamp placeholders.
8. Jurisdiction, governing law, or dispute resolution.
9. Any sections formatted in ALL CAPS or numbered obligations.

Document text to analyze:
${text}

Output strictly in JSON array format:
[
  { "highlighted_text": "exact text from document", "reason": "explanation of why this is important", "category": "legal_terms|dates|names|financial|confidentiality|termination|signatures|jurisdiction|formatted_text" }
]

Only include highlights that match the criteria above. Be precise with the highlighted_text - it should be the exact text from the document.`;

    console.log('Sending prompt to Gemini...');
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const analysisText = response.text();
    
    console.log('Gemini response received:');
    console.log('Response length:', analysisText.length);
    console.log('Response preview:', analysisText.substring(0, 500) + '...');
    
    // Try to parse the JSON response
    try {
      const analysis = JSON.parse(analysisText);
      console.log('Successfully parsed JSON analysis:');
      console.log('Number of highlights:', analysis.length);
      console.log('Analysis:', JSON.stringify(analysis, null, 2));
      return analysis;
    } catch (parseError) {
      console.error('Failed to parse Gemini response as JSON:', analysisText);
      console.error('Parse error:', parseError.message);
      // Fallback: return a simple analysis
      return [{
        highlighted_text: "Document analysis completed",
        reason: "AI analysis was performed but response format was invalid",
        category: "general"
      }];
    }
  } catch (error) {
    console.error('Gemini Analysis Error:', error);
    console.error('Error stack:', error.stack);
    throw new Error('Failed to analyze document with AI');
  }
}

// Routes
app.post('/api/upload', upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const filePath = req.file.path;
    const fileName = req.file.filename;
    
    console.log('Processing file:', fileName);

    // Perform OCR
    console.log('Starting OCR processing...');
    const extractedText = await performOCR(filePath);
    console.log('OCR completed. Text length:', extractedText?.length || 0);
    
    if (!extractedText || extractedText.trim().length === 0) {
      console.log('No text extracted from document');
      return res.status(400).json({ error: 'No text could be extracted from the document' });
    }

    // Analyze with Gemini
    console.log('Starting Gemini analysis...');
    const analysis = await analyzeWithGemini(extractedText);
    console.log('Gemini analysis completed. Number of highlights:', analysis?.length || 0);

    // Clean up uploaded file
    fs.unlinkSync(filePath);

    console.log('Sending response to frontend...');
    res.json({
      success: true,
      extractedText,
      analysis,
      fileName
    });

  } catch (error) {
    console.error('Upload Error:', error);
    
    // Clean up file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ 
      error: error.message || 'Failed to process document' 
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'BriefKey API is running',
    googleVision: visionClient ? 'Available' : 'Not available',
    geminiKey: geminiApiKey ? 'Set' : 'Not set'
  });
});

// Test endpoint for debugging
app.post('/api/test-ocr', upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const filePath = req.file.path;
    console.log('Testing OCR with file:', filePath);
    
    // Test OCR only
    const extractedText = await performOCR(filePath);
    
    // Clean up
    fs.unlinkSync(filePath);
    
    res.json({
      success: true,
      extractedText: extractedText || 'No text extracted',
      textLength: extractedText ? extractedText.length : 0
    });
    
  } catch (error) {
    console.error('OCR Test Error:', error);
    
    // Clean up
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ 
      error: error.message,
      stack: error.stack
    });
  }
});

// Test Gemini API connection
app.get('/api/test-gemini', async (req, res) => {
  try {
    console.log('Testing Gemini API connection...');
    
    if (!geminiApiKey) {
      return res.status(500).json({ 
        error: 'Gemini API key not found',
        geminiKey: 'Not set'
      });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent("Say 'Hello, Gemini API is working!'");
    const response = await result.response;
    const text = response.text();
    
    res.json({
      success: true,
      message: 'Gemini API is working!',
      response: text,
      geminiKey: 'Set'
    });
    
  } catch (error) {
    console.error('Gemini Test Error:', error);
    res.status(500).json({ 
      error: error.message,
      geminiKey: geminiApiKey ? 'Set but failed' : 'Not set'
    });
  }
});

// Test Gemini analysis with sample text
app.post('/api/test-analysis', async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'No text provided' });
    }

    console.log('Testing Gemini analysis with text:', text.substring(0, 100) + '...');
    
    const analysis = await analyzeWithGemini(text);
    
    res.json({
      success: true,
      analysis: analysis,
      textLength: text.length
    });
    
  } catch (error) {
    console.error('Analysis Test Error:', error);
    res.status(500).json({ 
      error: error.message,
      stack: error.stack
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 10MB.' });
    }
  }
  
  console.error('Server Error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});
