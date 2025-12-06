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
  "For every question number, examine the bubbles strictly based on visual evidence. " +
  "Return ONLY a raw JSON object with question numbers as keys (e.g., '1', '2'). " +
  "For each question:\n" +
  "- If exactly one bubble is clearly filled/darkened, return its option (e.g., 'A').\n" +
  "- If NO bubble is filled or the marks are too faint/ambiguous, return null.\n" +
  "- If MORE THAN ONE bubble is clearly filled, return an array of those options (e.g., ['A', 'C']).\n" +
  "Do NOT guess or infer any answer. Only consider a bubble filled if it is visually darkened enough to confidently identify it.\n" +
  "Do NOT include any explanation, reasoning, markdown, or additional text—return ONLY the raw JSON object.";


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
