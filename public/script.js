// public/script.js
async function callDeepSeekAPI() {
    const prompt = document.getElementById('prompt').value.trim();
    const responseDiv = document.getElementById('response');
    const button = document.querySelector('button');
    
    // Validate input
    if (!prompt) {
        responseDiv.innerHTML = '<div class="response error">Please enter a message</div>';
        return;
    }
    
    // Show loading state
    button.disabled = true;
    button.textContent = 'Sending...';
    responseDiv.innerHTML = '<div class="response loading">Calling DeepSeek API...</div>';
    
    try {
        // Call your backend server instead of DeepSeek directly
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: prompt
            })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || `Server error: ${response.status}`);
        }
        
        // Display the response
        responseDiv.innerHTML = `
            <div class="response success">
                <strong>DeepSeek Response:</strong><br><br>
                ${data.response.replace(/\n/g, '<br>')}
            </div>
        `;
        
    } catch (error) {
        console.error('Error:', error);
        responseDiv.innerHTML = `
            <div class="response error">
                <strong>Error:</strong><br>
                ${error.message}
            </div>
        `;
    } finally {
        // Reset button
        button.disabled = false;
        button.textContent = 'Send Request';
    }
}

// Allow Enter key to send message
document.addEventListener('DOMContentLoaded', function() {
    const textarea = document.getElementById('prompt');
    textarea.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            callDeepSeekAPI();
        }
    });
});