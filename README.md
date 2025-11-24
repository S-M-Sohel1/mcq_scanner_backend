# MCQ Scanner Backend - Node.js

A serverless backend API for analyzing Multiple Choice Question (MCQ) answer sheets using Google's Gemini AI. Built with Node.js and designed for deployment on Vercel.

## 🚀 Features

- **AI-Powered Analysis**: Uses Google Gemini AI to analyze MCQ answer sheets
- **Image Processing**: Supports JPEG, PNG, and GIF image formats
- **Serverless Architecture**: Runs on Vercel's serverless platform
- **CORS Enabled**: Ready for cross-origin requests from Flutter/web apps
- **Automatic Scaling**: Handles traffic spikes automatically

## 📋 Prerequisites

- Node.js 18+ installed
- Gemini API key ([Get one here](https://makersuite.google.com/app/apikey))
- Vercel account (for deployment)

## 🛠️ Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the root directory:

```env
GEMINI_API_KEY=your_actual_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash
NODE_ENV=development
```

> **Important**: Never commit your `.env` file to Git. Use `.env.example` as a template.

### 3. Local Development

Run the development server:

```bash
npm run dev
```

The API will be available at `http://localhost:3000`

### 4. Test the API

Use cURL to test the endpoint:

```bash
curl -X POST http://localhost:3000/api/analyze-sheet \
  -F "image=@/path/to/your/mcq-image.jpg"
```

Expected response:

```json
{
  "success": true,
  "data": {
    "1": "A",
    "2": "B",
    "3": "C",
    "4": null,
    "5": ["A", "C"]
  }
}
```

## 🚀 Deployment

### Deploy to Vercel

#### Option A: Using Vercel CLI

```bash
# Install Vercel CLI globally
npm install -g vercel

# Login to Vercel
vercel login

# Deploy to production
npm run deploy
```

#### Option B: Using GitHub Integration

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click **"Add New"** → **"Project"**
4. Import your GitHub repository
5. Vercel will auto-detect the configuration
6. Add environment variable: `GEMINI_API_KEY`
7. Click **"Deploy"**

### Configure Environment Variables on Vercel

1. Go to your project in Vercel Dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add:
   - **Key**: `GEMINI_API_KEY`
   - **Value**: Your Gemini API key
   - **Environment**: Select all (Production, Preview, Development)
4. Click **"Save"**
5. Redeploy if necessary

## 📡 API Endpoint

### POST `/api/analyze-sheet`

Analyzes an MCQ answer sheet image.

**Request:**
- Method: `POST`
- Content-Type: `multipart/form-data`
- Body: Form field `image` with the image file

**Response:**

Success (200):
```json
{
  "success": true,
  "data": {
    "1": "A",
    "2": "B",
    "3": "C"
  }
}
```

Error (400/500):
```json
{
  "success": false,
  "message": "Error description"
}
```

## 📂 Project Structure

```
mcq_scanner_backend/
├── api/
│   └── analyze-sheet.js      # Vercel serverless function
├── services/
│   └── geminiService.js      # Gemini API integration
├── .env                       # Environment variables (local)
├── .env.example              # Environment template
├── .gitignore
├── package.json
├── vercel.json               # Vercel configuration
└── README.md
```

## 🔍 Troubleshooting

### "GEMINI_API_KEY is not defined"
Make sure you've added the environment variable in Vercel Dashboard and redeployed.

### "File upload fails"
Ensure the request has `Content-Type: multipart/form-data` header and the field name is `image`.

### "Cold start timeout"
Vercel free tier has a 10-second timeout. Consider upgrading if processing takes longer.

### "Module not found"
Run `npm install` to ensure all dependencies are installed.

## 📝 License

MIT

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

**Made with ❤️ for efficient MCQ grading**
