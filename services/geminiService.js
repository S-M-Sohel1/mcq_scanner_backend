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
    // Using gemini-2.5-flash - confirmed available via API
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
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
      console.error('Full error details:', JSON.stringify(error, null, 2));
      if (error.response) {
        console.error('Response data:', error.response);
      }
      throw new Error('Failed to analyze image with Gemini API: ' + error.message);
    }
  }
}

module.exports = GeminiService;
