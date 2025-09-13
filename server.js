async function callDeepSeekAPI() {
  const prompt = document.getElementById('prompt').value.trim();
  const responseDiv = document.getElementById('response');
  const button = document.querySelector('button');

  if (!prompt) {
    responseDiv.innerHTML = '<div class="response error">Please enter a message</div>';
    return;
  }

  button.disabled = true;
  button.textContent = 'Sending...';
  responseDiv.innerHTML = '<div class="response loading">Calling DeepSeek API...</div>';

  try {
    const res = await fetch('/.netlify/functions/queryDeepSeek', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt })
    });

    const data = await res.json();

    if (data.error) throw new Error(data.error);

    const aiResponse = data.choices?.[0]?.message?.content || 'No response';
    responseDiv.innerHTML = `<div class="response success">${aiResponse.replace(/\n/g,'<br>')}</div>`;

  } catch (err) {
    responseDiv.innerHTML = `<div class="response error">Error: ${err.message}</div>`;
  } finally {
    button.disabled = false;
    button.textContent = 'Send Request';
  }
}
