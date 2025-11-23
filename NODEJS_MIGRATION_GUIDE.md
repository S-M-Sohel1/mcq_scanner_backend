# Node.js Migration Guide - MCQ Scanner Backend

This guide will help you convert your Laravel MCQ Scanner backend to Node.js with Express, ready for Vercel deployment.

---

## 📋 Project Structure

```
mcq-scanner-nodejs/
├── api/
│   └── analyze-sheet.js      # Vercel serverless function
├── services/
│   └── geminiService.js      # Gemini API integration
├── .env                       # Environment variables (local)
├── .gitignore
├── package.json
├── vercel.json               # Vercel configuration
└── README.md
```

---

## 🚀 Step 1: Initialize Node.js Project

```bash
# Create new directory
mkdir mcq-scanner-nodejs
cd mcq-scanner-nodejs

# Initialize npm
npm init -y

# Install dependencies
npm install @google/generative-ai multer express dotenv
npm install -D vercel
```

---

## ⚙️ Step 2: Create Environment Configuration

Create `.env` file:

```env
GEMINI_API_KEY=your_gemini_api_key_here
NODE_ENV=development
```

Create `.env.example`:

```env
GEMINI_API_KEY=
NODE_ENV=development
```

---

## 📝 Step 3: Create Gemini Service

Create `services/geminiService.js`:

```javascript
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');

class GeminiService {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
    
    if (!this.apiKey) {
      console.error('GeminiService: API Key is empty!');
    } else {
      console.log(`GeminiService: API Key loaded. Length: ${this.apiKey.length}, First 4 chars: ${this.apiKey.substring(0, 4)}`);
    }
    
    this.genAI = new GoogleGenerativeAI(this.apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
  }

  async analyzeImage(imagePath) {
    try {
      // Read image file
      const imageBuffer = fs.readFileSync(imagePath);
      const base64Image = imageBuffer.toString('base64');
      
      // Determine mime type
      let mimeType = 'image/jpeg';
      if (imagePath.toLowerCase().endsWith('.png')) {
        mimeType = 'image/png';
      } else if (imagePath.toLowerCase().endsWith('.gif')) {
        mimeType = 'image/gif';
      }

      const prompt = 
        "Analyze this image of an MCQ (Multiple Choice Question) sheet. " +
        "Identify the question numbers and the selected option(s) for each. " +
        "Return the result strictly as a JSON object where keys are question numbers (e.g., '1', '2') " +
        "and values are the selected options (e.g., 'A', 'B', 'C', 'D'). " +
        "If a question is not answered, use null. " +
        "If multiple options are marked for a single question, return them as an array (e.g., ['A', 'C']). " +
        "Do not include any markdown formatting or explanations, just the raw JSON.";

      const imagePart = {
        inlineData: {
          data: base64Image,
          mimeType: mimeType,
        },
      };

      const result = await this.model.generateContent([prompt, imagePart]);
      const response = await result.response;
      const text = response.text();

      // Clean up potential markdown code blocks
      const cleanedText = text.replace(/```json|```/g, '').trim();
      
      return JSON.parse(cleanedText);
    } catch (error) {
      console.error('Gemini Analysis Error:', error.message);
      throw new Error('Failed to analyze image with Gemini API.');
    }
  }
}

module.exports = GeminiService;
```

---

## 🌐 Step 4: Create API Endpoint (Vercel Serverless Function)

Create `api/analyze-sheet.js`:

```javascript
const multer = require('multer');
const GeminiService = require('../services/geminiService');
const fs = require('fs');
const path = require('path');

// Configure multer for file uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: '/tmp',
    filename: (req, file, cb) => {
      cb(null, `${Date.now()}-${file.originalname}`);
    }
  }),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, JPG, and GIF are allowed.'));
    }
  }
});

// Helper to run middleware in serverless context
const runMiddleware = (req, res, fn) => {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
};

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed'
    });
  }

  try {
    // Process file upload
    await runMiddleware(req, res, upload.single('image'));

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file uploaded'
      });
    }

    // Analyze image
    const geminiService = new GeminiService();
    const analysisResult = await geminiService.analyzeImage(req.file.path);

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    return res.status(200).json({
      success: true,
      data: analysisResult
    });

  } catch (error) {
    console.error('MCQ Analysis Error:', error.message);
    
    // Clean up file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to analyze the image. Please try again.'
    });
  }
};
```

---

## 🔧 Step 5: Create Vercel Configuration

Create `vercel.json`:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "api/**/*.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/$1"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

---

## 📦 Step 6: Update package.json

Your `package.json` should look like:

```json
{
  "name": "mcq-scanner-nodejs",
  "version": "1.0.0",
  "description": "MCQ Scanner Backend API using Node.js and Gemini AI",
  "main": "index.js",
  "scripts": {
    "dev": "vercel dev",
    "deploy": "vercel --prod"
  },
  "keywords": ["mcq", "scanner", "gemini", "nodejs"],
  "author": "",
  "license": "MIT",
  "dependencies": {
    "@google/generative-ai": "^0.21.0",
    "dotenv": "^16.4.5",
    "express": "^4.18.2",
    "multer": "^1.4.5-lts.1"
  },
  "devDependencies": {
    "vercel": "^33.0.0"
  }
}
```

---

## 🙈 Step 7: Create .gitignore

Create `.gitignore`:

```
node_modules/
.env
.env.local
.vercel
*.log
.DS_Store
/tmp
```

---

## 🧪 Step 8: Test Locally

```bash
# Install Vercel CLI globally (if not done)
npm install -g vercel

# Run development server
vercel dev

# Test the endpoint
# Server will run at http://localhost:3000
```

Test with cURL:

```bash
curl -X POST http://localhost:3000/api/analyze-sheet \
  -F "image=@/path/to/your/test-image.jpg"
```

---

## 🚀 Step 9: Deploy to Vercel

### Option A: Deploy via CLI

```bash
# Login to Vercel
vercel login

# Deploy to production
vercel --prod
```

### Option B: Deploy via GitHub

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click "Add New" → "Project"
4. Import your GitHub repository
5. Vercel will auto-detect the configuration
6. Add environment variable: `GEMINI_API_KEY`
7. Click "Deploy"

---

## 🔐 Step 10: Configure Environment Variables in Vercel

1. Go to your project in Vercel Dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add the following:
   - **Key**: `GEMINI_API_KEY`
   - **Value**: Your Gemini API key
   - **Environment**: Production, Preview, Development (select all)
4. Click "Save"

---

## 📱 Step 11: Update Flutter App

Update your Flutter app's API endpoint:

```dart
// Before
final apiUrl = 'http://your-domain.com/api/analyze-sheet';

// After
final apiUrl = 'https://your-vercel-app.vercel.app/api/analyze-sheet';
```

---

## ✅ Verification Checklist

- [ ] All dependencies installed
- [ ] `.env` file created with `GEMINI_API_KEY`
- [ ] Services directory and `geminiService.js` created
- [ ] API directory and `analyze-sheet.js` created
- [ ] `vercel.json` configuration file created
- [ ] `.gitignore` includes `.env` and `node_modules`
- [ ] Tested locally with `vercel dev`
- [ ] Environment variables set in Vercel dashboard
- [ ] Deployed to Vercel successfully
- [ ] API endpoint returns correct response
- [ ] Flutter app updated with new endpoint

---

## 🔍 Troubleshooting

### Issue: "GEMINI_API_KEY is not defined"
**Solution**: Make sure you've added the environment variable in Vercel Dashboard and redeployed.

### Issue: "File upload fails"
**Solution**: Ensure the request has `Content-Type: multipart/form-data` header and the field name is `image`.

### Issue: "Cold start timeout"
**Solution**: Vercel free tier has 10-second timeout. Consider upgrading if processing takes longer.

### Issue: "Module not found"
**Solution**: Run `npm install` to ensure all dependencies are installed.

---

## 📊 Comparison: Laravel vs Node.js

| Feature | Laravel | Node.js + Vercel |
|---------|---------|------------------|
| **Setup Time** | Complex | Simple |
| **Deployment** | Requires PHP hosting | One-click on Vercel |
| **Cold Start** | N/A | ~500ms |
| **Scaling** | Manual | Automatic |
| **Cost** | $5-10/month | Free tier available |
| **Performance** | Good | Excellent |

---

## 🎉 You're Done!

Your MCQ Scanner backend is now running on Node.js and deployed to Vercel with serverless functions. The API endpoint will be:

```
https://your-app-name.vercel.app/api/analyze-sheet
```

Test it and update your Flutter app accordingly!
