// public/script.js
async function callDeepSeekAPI() {
  const prompt = `
Make a 5-question multiple choice quiz about ${document.getElementById('prompt').value.trim()}.
Return ONLY valid JSON in this exact format:

{
  "title": "Quiz Title",
  "instructions": "Choose the best answer for each question",
  "questions": [
    {
      "id": 1,
      "question": "The question here",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 0,
      "explanation": "Explanation of why this answer is correct"
    }
  ]
}

Make sure correctAnswer is the index (0-3) of the correct option in the options array.
`;
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
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: prompt })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || `Server error: ${response.status}`);

    let quiz;
    try {
      let raw = data.response.trim();
      console.log(raw)
      // Remove Markdown code fences if they exist
      if (raw.startsWith("```")) {
        raw = raw.replace(/```[a-zA-Z]*\n?/, "").replace(/```$/, "").trim();
      }

      quiz = JSON.parse(raw);
    } catch (err) {
      throw new Error("Invalid JSON from API: " + err.message);
    }

    // Build the quiz form dynamically
    let html = `
            <h2>${quiz.title}</h2>
            <p>${quiz.instructions}</p>
            <form id="quizForm">
        `;

    quiz.questions.forEach(q => {
      html += `
                <div class="question">
                    <p><b>Q${q.id}:</b> ${q.question}</p>
                    <div class="options">
            `;
      
      // Add radio button options
      q.options.forEach((option, index) => {
        html += `
                        <label>
                            <input type="radio" name="q${q.id}" value="${index}">
                            ${String.fromCharCode(65 + index)}. ${option}
                        </label><br>
                `;
      });

      html += `
                    </div>
                    <div class="answer hidden" data-correct="${q.correctAnswer}">
                        <strong>Correct Answer:</strong> ${String.fromCharCode(65 + q.correctAnswer)}. ${q.options[q.correctAnswer]}<br>
                        <em>${q.explanation}</em>
                    </div>
                </div>
            `;
    });

    html += `
            <button type="submit">Check Answers</button>
            <div id="score" class="hidden"></div>
        </form>`;
    responseDiv.innerHTML = html;

    // Add checking logic
    document.getElementById('quizForm').addEventListener('submit', function (e) {
      e.preventDefault();
      
      let correct = 0;
      let total = quiz.questions.length;
      
      quiz.questions.forEach(q => {
        const selectedAnswer = document.querySelector(`input[name="q${q.id}"]:checked`);
        const answerDiv = document.querySelector(`.answer[data-correct="${q.correctAnswer}"]`).closest('.question');
        const answerElement = answerDiv.querySelector('.answer');
        
        answerElement.classList.remove('hidden');
        
        if (selectedAnswer) {
          const selectedValue = parseInt(selectedAnswer.value);
          if (selectedValue === q.correctAnswer) {
            correct++;
            answerElement.style.backgroundColor = '#d4edda';
            answerElement.style.color = '#155724';
            answerElement.style.border = '1px solid #c3e6cb';
          } else {
            answerElement.style.backgroundColor = '#f8d7da';
            answerElement.style.color = '#721c24';
            answerElement.style.border = '1px solid #f5c6cb';
          }
        } else {
          answerElement.style.backgroundColor = '#fff3cd';
          answerElement.style.color = '#856404';
          answerElement.style.border = '1px solid #ffeaa7';
        }
        
        answerElement.style.padding = '10px';
        answerElement.style.marginTop = '10px';
        answerElement.style.borderRadius = '5px';
      });
      
      // Show score
      const scoreDiv = document.getElementById('score');
      scoreDiv.innerHTML = `<h3>Your Score: ${correct}/${total} (${Math.round((correct/total) * 100)}%)</h3>`;
      scoreDiv.classList.remove('hidden');
      scoreDiv.style.marginTop = '20px';
      scoreDiv.style.padding = '15px';
      scoreDiv.style.backgroundColor = correct === total ? '#d4edda' : correct >= total/2 ? '#fff3cd' : '#f8d7da';
      scoreDiv.style.border = `1px solid ${correct === total ? '#c3e6cb' : correct >= total/2 ? '#ffeaa7' : '#f5c6cb'}`;
      scoreDiv.style.borderRadius = '5px';
    });

  } catch (error) {
    console.error('Error:', error);
    responseDiv.innerHTML = `<div class="response error"><strong>Error:</strong><br>${error.message}</div>`;
  } finally {
    button.disabled = false;
    button.textContent = 'Send Request';
  }
}

document.addEventListener('DOMContentLoaded', function () {
  const textarea = document.getElementById('prompt');
  textarea.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      callDeepSeekAPI();
    }
  });
});