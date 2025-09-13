// server.js
const express = require('express');
const axios = require('axios');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static('public')); // Serve static files from 'public' folder

// DeepSeek API function (from your original code)
async function callDeepSeek(message) {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    
    if (!apiKey) {
        throw new Error('DEEPSEEK_API_KEY not found in environment variables');
    }
    
    try {
        console.log(`🤖 Sending to DeepSeek: "${message}"`);
        
        const response = await axios.post('https://api.deepseek.com/v1/chat/completions', {
            model: 'deepseek-chat',
            messages: [
                {
                    role: 'user',
                    content: message
                }
            ],
            max_tokens: 1000,
            temperature: 0.7
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            }
        });
        
        const aiResponse = response.data.choices[0].message.content;
        console.log(`✅ DeepSeek Response:\n${aiResponse}\n`);
        
        return aiResponse;
        
    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
        throw error;
    }
}

// API endpoint for frontend to call
app.post('/api/chat', async (req, res) => {
    try {
        const { message } = req.body;
        
        if (!message) {
            return res.status(400).json({ 
                error: 'Message is required' 
            });
        }
        
        const response = await callDeepSeek(message);
        
        res.json({ 
            success: true,
            response: response 
        });
        
    } catch (error) {
        console.error('API Error:', error.message);
        res.status(500).json({ 
            error: 'Failed to get response from DeepSeek API',
            details: error.message
        });
    }
});

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`🔑 API Key configured: ${process.env.DEEPSEEK_API_KEY ? '✅ Yes' : '❌ No'}`);
});