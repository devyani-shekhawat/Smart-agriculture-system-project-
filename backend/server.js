require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Groq = require('groq-sdk');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Groq
const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/', (req, res) => {
    res.json({ status: 'Smart Agriculture AI Backend is running with Groq!' });
});

// AI Chat endpoint
app.post('/api/chat', async (req, res) => {
    try {
        const { message, sensorData } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        const systemPrompt = `You are an expert plant care assistant for a basil plant monitoring system. 

Current sensor readings:
- Temperature: ${sensorData.temperature}°C
- Humidity: ${sensorData.humidity}%
- Soil Moisture: ${sensorData.soilMoisture} (${sensorData.soilStatus})
  * >2500 = DRY (needs water)
  * 1500-2500 = MOIST (good)
  * <1500 = WET (too much water)
- Light Level: ${sensorData.lightLevel} (${sensorData.lightStatus})
  * <1000 = DARK (needs more light)
  * 1000-2500 = DIM (okay)
  * >2500 = BRIGHT (good)

Basil plant care guidelines:
- Optimal temperature: 18-24°C
- Optimal humidity: 40-60%
- Water when soil is dry (>2500)
- Needs bright light (>2500)
- Sensitive to overwatering

Provide concise, helpful advice based on the current sensor data. Be friendly and practical.`;

        const completion = await groq.chat.completions.create({
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: message }
            ],
            model: 'llama-3.3-70b-versatile',
            temperature: 0.7,
            max_tokens: 300
        });

        const aiResponse = completion.choices[0].message.content;
        res.json({ response: aiResponse });

    } catch (error) {
        console.error('Error calling Groq:', error);
        res.status(500).json({ 
            error: 'Failed to get AI response',
            details: error.message 
        });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Backend server running on http://localhost:${PORT}`);
    console.log(`✅ Groq AI configured (FREE!)`);
});
