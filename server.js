require('dotenv').config();
const express = require('express');
const multer = require('multer');
const GeminiService = require('./services/geminiService');
const fs = require('fs');
const os = require('os');

const app = express();
const PORT = process.env.PORT || 3000;

// Configure multer for file uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: './tmp',
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

// Create tmp directory if it doesn't exist
if (!fs.existsSync('./tmp')) {
  fs.mkdirSync('./tmp');
}

// Enable CORS
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// Health check endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'MCQ Scanner Backend API is running',
    endpoints: {
      analyze: '/api/analyze-sheet (POST)'
    }
  });
});

// MCQ Analysis endpoint
app.post('/api/analyze-sheet', upload.single('image'), async (req, res) => {
  try {
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
    console.error('Full error:', error);
    
    // Clean up file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to analyze the image. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get local network IP address
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Skip internal and non-IPv4 addresses
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

// Start server
app.listen(PORT, '0.0.0.0', () => {
  const localIP = getLocalIP();
  console.log('\n🚀 MCQ Scanner Backend Server is running!');
  console.log('\n📍 Access URLs:');
  console.log(`   Local:    http://localhost:${PORT}`);
  console.log(`   Network:  http://${localIP}:${PORT}`);
  console.log('\n📡 API Endpoint:');
  console.log(`   POST http://${localIP}:${PORT}/api/analyze-sheet`);
  console.log('\n✅ Server is accessible from your WiFi network');
  console.log('   Use the Network URL to connect from other devices\n');
});
