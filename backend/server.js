const path = require('path')
const express = require('express')
const cors = require('cors')
const axios = require('axios')
require('dotenv').config()

const app = express()
const port = 3000

app.use(cors())
app.use(express.json())

// Serve frontend build
const frontendPath = path.join(__dirname, 'frontend', 'dist')
app.use(express.static(frontendPath))

// API route
app.post('/deepseek', async (req, res) => {
    try {
        const { messages } = req.body
        if (!messages) return res.status(400).json({ error: 'No messages provided' })

        const response = await axios.post(
            'https://api.deepseek.com/v1/chat/completions',
            { model: 'deepseek-chat', messages },
            { headers: { 
                'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
                'Content-Type': 'application/json'
            }}
        )
        res.json(response.data)
    } catch (error) {
        console.error(error.response?.data || error.message)
        res.status(500).json({ error: 'Failed to call DeepSeek API' })
    }
})

// Catch-all for frontend routing
app.get('/', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'))
})

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`)
})
