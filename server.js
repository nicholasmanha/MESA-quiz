// script.js - Frontend calls DeepSeek API directly
async function callDeepSeekAPI() {
    const apiKey = document.getElementById('apiKey').value.trim();
    const prompt = document.getElementById('prompt').value.trim();
    const responseDiv = document.getElementById('response');
    const button = document.querySelector('button');
    
    // Validate inputs
    if (!apiKey) {
        responseDiv.innerHTML = '<div class="response error">Please enter your API key</div>';
        return;
    }
    
    if (!prompt) {
        responseDiv.innerHTML = '<div class="response error">Please enter a message</div>';
        return;
    }
    
    // Show loading state
    button.disabled = true;
    button.textContent = 'Sending...';
    responseDiv.innerHTML = '<div class="response loading">Calling DeepSeek API...</div>';
    
    try {
        // Call DeepSeek API directly from frontend
        const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                max_tokens: 1000,
                temperature: 0.7
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        const aiResponse = data.choices[0].message.content;
        
        // Display the response
        responseDiv.innerHTML = `
            <div class="response success">
                <strong>DeepSeek Response:</strong><br><br>
                ${aiResponse.replace(/\n/g, '<br>')}
            </div>
        `;
        
    } catch (error) {
        console.error('Error:', error);
        
        let errorMessage = error.message;
        
        // Handle common errors
        if (errorMessage.includes('Failed to fetch')) {
            errorMessage = 'Network error - check your internet connection or CORS settings';
        } else if (errorMessage.includes('401')) {
            errorMessage = 'Invalid API key - please check your DeepSeek API key';
        } else if (errorMessage.includes('429')) {
            errorMessage = 'Rate limit exceeded - please wait and try again';
        }
        
        responseDiv.innerHTML = `
            <div class="response error">
                <strong>Error:</strong><br>
                ${errorMessage}
            </div>
        `;
    } finally {
        // Reset button
        button.disabled = false;
        button.textContent = 'Send Request';
    }
}

// Save API key to localStorage for convenience (optional)
function saveApiKey() {
    const apiKey = document.getElementById('apiKey').value.trim();
    if (apiKey) {
        localStorage.setItem('deepseek_api_key', apiKey);
    }
}

function loadApiKey() {
    const savedKey = localStorage.getItem('deepseek_api_key');
    if (savedKey) {
        document.getElementById('apiKey').value = savedKey;
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Load saved API key
    loadApiKey();
    
    // Save API key when it changes
    document.getElementById('apiKey').addEventListener('blur', saveApiKey);
    
    // Allow Enter to send (but Shift+Enter for new line in textarea)
    document.getElementById('prompt').addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            callDeepSeekAPI();
        }
    });
    
    // Clear response when typing new message
    document.getElementById('prompt').addEventListener('input', function() {
        const responseDiv = document.getElementById('response');
        if (responseDiv.innerHTML) {
            responseDiv.innerHTML = '';
        }
    });
});