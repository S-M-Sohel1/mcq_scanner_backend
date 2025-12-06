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
    
    // Get model name from environment variable, fallback to gemini-2.5-flash
    const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
    console.log(`GeminiService: Using model: ${modelName}`);
    
    this.genAI = new GoogleGenerativeAI(this.apiKey);
    this.model = this.genAI.getGenerativeModel({ model: modelName });
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
  "Analyze the provided image of an MCQ (Multiple Choice Question) answer sheet. " +
  "Detect all question numbers and determine which option(s) are filled for each question. " +
  "Return ONLY a raw JSON object (no markdown, no explanation, no extra text). " +
  "Use question numbers as keys (e.g., '1', '2'). " +
  "Set the value to a single option ('A', 'B', 'C', 'D') if exactly one bubble is filled. " +
  "Use null if the question has no filled option. " +
  "If multiple bubbles appear filled for the same question, return them as an array (e.g., ['A', 'C']). " +
  "Ensure the JSON is strictly valid and contains no additional fields.";


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
      console.error('Full error details:', JSON.stringify(error, null, 2));
      if (error.response) {
        console.error('Response data:', error.response);
      }
      throw new Error('Failed to analyze image with Gemini API: ' + error.message);
    }
  }
}

module.exports = GeminiService;
