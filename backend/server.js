const express = require('express')
const axios = require('axios')
const cors = require('cors')
require('dotenv').config()
const app = express()
const port = 3000

app.use(cors())
app.use(express.json())

app.get('/', (req, res) => {
  res.send('Server is running!')
})

// POST endpoint to call DeepSeek API with frontend messages
app.post('/deepseek', async (req, res) => {
    console.log("hello")
  try {
    const { messages } = req.body // <- get messages from frontend
    console.log('Received messages:', messages)
    if (!messages) {
      return res.status(400).json({ error: 'No messages provided' })
    }

    const response = await axios.post(
      'https://api.deepseek.com/v1/chat/completions',
      {
        model: 'deepseek-chat',
        messages, // use messages from frontend
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    )

    res.json(response.data)
  } catch (error) {
    console.error(error.response?.data || error.message)
    res.status(500).json({ error: 'Failed to call DeepSeek API' })
  }
})

app.listen(port, () => {
  console.log(`Server listening on port ${port}`)
})
