## Clean copy note

This is a clean source copy maintained by EJICKmini, based on [Micro-SaaS-Hackathon/Alasan](https://github.com/Micro-SaaS-Hackathon/Alasan). It starts with fresh Git history; see the upstream repository for the original commit history and contributor credits.

For safety, this copy excludes the committed credential file and history, generated uploaded documents under `backend/uploads/`, and the unreviewed `BriefKey.rar` and `backend/eng.traineddata` files. Backend credentials belong in `backend/.env`; use `backend/env.example` as a template. Do not commit real credentials or uploaded documents.

# Document Analyzer

An AI-powered document analysis application that uses OCR (Tesseract.js) to extract text from PDFs and images, then analyzes the content with Google's Gemini AI to identify important legal and business sections.

## Features

- **Document Upload**: Support for PDF and image files (PNG, JPG, JPEG)
- **OCR Text Extraction**: Uses Tesseract.js for local, free text extraction
- **AI Analysis**: Powered by Google Gemini API to identify important sections
- **Smart Highlighting**: Categorizes and highlights:
  - Legal terminology and binding clauses
  - Dates, deadlines, and time limits
  - Names of parties, organizations, or identifiers
  - Financial amounts, payments, or penalties
  - NDA/confidentiality or intellectual property mentions
  - Termination, liability, and risk allocation
  - Signature lines, initials, or stamp placeholders
  - Jurisdiction, governing law, or dispute resolution
  - Text in ALL CAPS or numbered obligations
- **Interactive UI**: Modern React interface with Tailwind CSS
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

- **Frontend**: React + Tailwind CSS
- **Backend**: Node.js + Express
- **OCR**: Tesseract.js (free, local)
- **AI Analysis**: Google Gemini API
- **File Upload**: Multer with validation

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Google Gemini API key (free tier available)

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd document-analyzer
```

### 2. Install Dependencies

```bash
# Install root dependencies
npm install

# Install all dependencies (frontend + backend)
npm run install-all
```

### 3. Environment Configuration

Create a `.env` file in the `backend` directory:

```bash
cd backend
cp env.example .env
```

Edit the `.env` file and add your Gemini API key:

```env
PORT=5000
GEMINI_API_KEY=your_gemini_api_key_here
GOOGLE_CLOUD_VISION_KEY=optional_google_cloud_vision_service_account_json
```

### 4. Get Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Copy the key and add it to your `.env` file

### 5. Run the Application

#### Development Mode (Recommended)

```bash
# From the root directory
npm run dev
```

This will start both the backend server (port 5000) and frontend development server (port 3000) concurrently.

#### Manual Start

If you prefer to start them separately:

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm start
```

### 6. Access the Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- Health Check: http://localhost:5000/api/health

## Usage

1. **Upload Document**: Drag and drop or click to upload a PDF or image file
2. **Processing**: The app will extract text using OCR and analyze it with AI
3. **View Results**: 
   - Left panel shows the extracted text with highlighted important sections
   - Right sidebar displays AI-generated explanations for each highlight
4. **Filter & Search**: Use the sidebar to filter by category or search for specific terms
5. **Copy Text**: Click the copy icon to copy highlighted text to clipboard

## API Endpoints

### POST /api/upload
Upload and process a document.

**Request**: Multipart form data with `document` field
**Response**: 
```json
{
  "success": true,
  "extractedText": "extracted text content",
  "analysis": [
    {
      "highlighted_text": "specific text",
      "reason": "explanation",
      "category": "legal_terms"
    }
  ],
  "fileName": "original_filename.pdf"
}
```

### GET /api/health
Health check endpoint.

**Response**:
```json
{
  "status": "OK",
  "message": "Document Analyzer API is running"
}
```

## Deployment

### Frontend (Vercel/Netlify)

1. Build the frontend:
```bash
cd frontend
npm run build
```

2. Deploy the `build` folder to your hosting service

### Backend (Render/Railway/Google Cloud Run)

1. Set environment variables in your hosting platform
2. Deploy the `backend` folder
3. Update the frontend's API URL if needed

### Environment Variables for Production

- `PORT`: Server port (default: 5000)
- `GEMINI_API_KEY`: Your Gemini API key
- `GOOGLE_CLOUD_VISION_KEY`: Optional Google Cloud Vision service account JSON

## File Structure

```
document-analyzer/
├── backend/
│   ├── server.js              # Express server
│   ├── package.json           # Backend dependencies
│   ├── env.example           # Environment variables template
│   └── uploads/              # Temporary file storage
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/       # React components
│   │   │   ├── Header.js
│   │   │   ├── DocumentUpload.js
│   │   │   ├── DocumentViewer.js
│   │   │   └── AnalysisSidebar.js
│   │   ├── App.js            # Main app component
│   │   ├── index.js          # React entry point
│   │   └── index.css         # Tailwind CSS
│   ├── package.json          # Frontend dependencies
│   ├── tailwind.config.js    # Tailwind configuration
│   └── postcss.config.js     # PostCSS configuration
├── package.json              # Root package.json
└── README.md                 # This file
```

## Troubleshooting

### Common Issues

1. **OCR not working**: Ensure Tesseract.js is properly installed
2. **Gemini API errors**: Check your API key and quota limits
3. **File upload fails**: Verify file size (max 10MB) and format
4. **CORS errors**: Ensure backend is running on port 5000

### Performance Tips

- For large documents, consider implementing pagination
- Use image optimization for better OCR accuracy
- Implement caching for repeated analyses

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review the API documentation
3. Open an issue on GitHub
