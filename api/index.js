module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  
  return res.status(200).json({
    success: true,
    message: 'MCQ Scanner Backend API',
    version: '1.0.0',
    endpoints: {
      analyzeSheet: {
        url: '/api/analyze-sheet',
        method: 'POST',
        description: 'Analyze MCQ answer sheet image',
        parameters: {
          image: 'Form-data file (JPEG, PNG, GIF)'
        }
      }
    },
    documentation: 'https://github.com/S-M-Sohel1/mcq_scanner_backend'
  });
};
