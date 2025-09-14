import React, { useState } from "react";

interface QuizData {
  category: string;
  difficulty: number;
  question: string;
  choices: string[];
  correctChoice: number;
}

type GameState =
  | "input"
  | "preview"
  | "wagering"
  | "question"
  | "result"
  | "gameOver";

function App() {
  const [text, setText] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [money, setMoney] = useState(5000);
  const [input, setInput] = useState("");
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [answered, setAnswered] = useState(false);
  const [gameState, setGameState] = useState<GameState>("input");
  const [wager, setWager] = useState<number>(100);
  const [maxWager, setMaxWager] = useState<number>(100);

  const parseQuizResponse = (response: string): QuizData | null => {
    try {
      const parts = response.split(";");
      if (parts.length !== 8) return null;

      return {
        category: parts[0],
        difficulty: parseInt(parts[1]),
        question: parts[2],
        choices: [parts[3], parts[4], parts[5], parts[6]],
        correctChoice: parseInt(parts[7].replace(/\D/g, ''), 10),
      };
    } catch (error) {
      console.error("Error parsing quiz response:", error);
      return null;
    }
  };

  const sendMessage = async (subjectText: string) => {
    setLoading(true);
    setQuizData(null);
    setSelectedChoice(null);
    setShowResult(false);
    setAnswered(false);

    try {
      const response = await fetch("http://localhost:3000/deepseek", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content: `Generate a unique and varied multiple choice question about ${subjectText}. Make it a random difficulty out of 5 (try to avoid 4). Focus on different aspects, subtopics, or angles each time. Avoid common or basic questions. Be creative and diverse in your question types (factual, analytical, application-based, etc.). Provide a 1-3 word category. Answer in the format <category>;<difficulty out of 5>;<question>;<choice 1>;<choice 2>;<choice 3>;<choice 4>;<correct choice number>.`,
            },
          ],
        }),
      });
      const json = await response.json();
      const reply = json.choices?.[0]?.message?.content || "No reply found";
      console.log(text)
      setText(reply);

      const parsed = parseQuizResponse(reply);
      if (parsed) {
        setQuizData(parsed);
        setGameState("preview");
        // Set max wager based on current money
        const maxPossibleWager = Math.floor(money / 10) * 10; // Round down to nearest 10
        setMaxWager(Math.min(maxPossibleWager, 1000)); // Cap at 1000
        setWager(Math.min(100, maxPossibleWager)); // Default wager
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      setText("Error fetching response");
    }
    setLoading(false);
    
  };

  const handleChoiceSelect = (choiceIndex: number) => {
    if (answered) return;
    setSelectedChoice(choiceIndex);
  };

  const handleSubmitAnswer = () => {
    if (selectedChoice === null || !quizData) return;

    setAnswered(true);
    setShowResult(true);
    setGameState("result");

    const isCorrect = selectedChoice === quizData.correctChoice - 1; // Convert to 0-based index
    const multiplier = quizData.difficulty; // Use difficulty as multiplier

    if (isCorrect) {
      setMoney((prev) => prev + wager * multiplier);
    } else {
      setMoney((prev) => Math.max(0, prev - wager * multiplier));
    }
  };

  const resetQuiz = () => {
    setQuizData(null);
    setSelectedChoice(null);
    setShowResult(false);
    setAnswered(false);
    setText(null);
    setGameState("input");
    setMoney(5000);
    setWager(100);
  };

  const proceedToWagering = () => {
    setGameState("wagering");
  };

  const proceedToQuestion = () => {
    setGameState("question");
  };

  const calculatePotentialWin = () => {
    return quizData ? wager * quizData.difficulty : 0;
  };

  const calculatePotentialLoss = () => {
    return quizData ? wager * quizData.difficulty : 0;
  };

  const getDifficultyColor = (difficulty: number) => {
    switch (difficulty) {
      case 1:
        return "text-green-500";
      case 2:
        return "text-green-400";
      case 3:
        return "text-yellow-500";
      case 4:
        return "text-orange-500";
      case 5:
        return "text-red-500";
      default:
        return "text-gray-500";
    }
  };

  const getDifficultyStars = (difficulty: number) => {
    return "★".repeat(difficulty) + "☆".repeat(5 - difficulty);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-4xl font-bold text-center text-blue-600 mb-4">
            QuizBust
          </h1>
          <div className="text-center">
            <p className="text-2xl font-semibold text-green-600">
              💰 Current Balance: ${money}
            </p>
          </div>
        </div>

        {gameState === "input" && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="text-center">
              <h2 className="text-2xl font-semibold mb-4">
                Generate a Quiz Question
              </h2>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Enter a subject (e.g., Mathematics, History, Science)"
                className="w-full bg-blue-50 max-w-md p-3 border border-gray-300 rounded-lg mb-4 text-center text-black"
              />
              <br />
              <button
                onClick={() => sendMessage(input)}
                disabled={loading || !input.trim()}
                className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-bold py-3 px-6 rounded-lg transition-colors"
              >
                {loading ? "Generating Question..." : "Start Game"}
              </button>
            </div>
          </div>
        )}

        {loading && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-lg text-gray-800">Generating your question...</p>
            </div>
          </div>
        )}

        {gameState === "preview" && quizData && (
          <>
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="text-center">
                <h2 className="text-2xl font-semibold mb-6">
                  Question Preview
                </h2>
                <div className="mb-6">
                  <div className="inline-block bg-blue-100 text-blue-800 px-4 py-2 rounded-full font-semibold text-lg mb-4">
                    Subject: {quizData.category}
                  </div>
                  <div
                    className={`text-2xl font-bold mb-4 ${getDifficultyColor(
                      quizData.difficulty
                    )}`}
                  >
                    Difficulty: {getDifficultyStars(quizData.difficulty)} (
                    {quizData.difficulty}/5)
                  </div>
                  <p className="text-gray-600 mb-6">
                    Higher difficulty means higher risk and reward!
                  </p>
                </div>
                
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="text-center">
                <h2 className="text-2xl font-semibold mb-6">
                  Place Your Wager
                </h2>
                

                <div className="max-w-md mx-auto mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Wager Amount: ${wager}
                  </label>
                  <input
                    type="range"
                    min="10"
                    max={maxWager}
                    step="10"
                    value={wager}
                    onChange={(e) => setWager(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-sm text-gray-500 mt-1">
                    <span>$10</span>
                    <span>${maxWager}</span>
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-green-600 font-bold text-xl">
                        If Correct: +${calculatePotentialWin()}
                      </div>
                      <div className="text-sm text-gray-600">
                        Wager × {quizData.difficulty} (difficulty multiplier)
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-red-600 font-bold text-xl">
                        If Wrong: -${calculatePotentialLoss()}
                      </div>
                      <div className="text-sm text-gray-600">
                        Wager × {quizData.difficulty} (difficulty multiplier)
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={proceedToQuestion}
                  disabled={wager > money}
                  className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-bold py-3 px-6 rounded-lg transition-colors"
                >
                  Lock In Wager
                </button>
              

                {wager > money && (
                  <p className="text-red-600 mt-4">
                    Insufficient funds! You only have ${money}
                  </p>
                )}
              </div>
            </div>
          </>
        )}

      
        {gameState === "question" && quizData && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-semibold">
                  {quizData.category}
                </span>
                <div className="text-right">
                  <div
                    className={`font-bold ${getDifficultyColor(
                      quizData.difficulty
                    )}`}
                  >
                    {getDifficultyStars(quizData.difficulty)} (
                    {quizData.difficulty}/5)
                  </div>
                  <div className="text-sm text-gray-600">
                    Wagered: ${wager} | Potential: ±${calculatePotentialWin()}
                  </div>
                </div>
              </div>

              <h3 className="text-xl font-semibold mb-6 text-gray-800 leading-relaxed">
                {quizData.question}
              </h3>
            </div>

            <div className="space-y-3">
              {quizData.choices.map((choice, index) => {
                let buttonClass =
                  "w-full p-4 text-left border-2 rounded-lg transition-all bg-blue-50 text-gray-800 ";

                if (selectedChoice === index) {
                  buttonClass += "border-blue-500 bg-blue-100 text-blue-800";
                } else {
                  buttonClass +=
                    "border-gray-300 hover:border-blue-300 hover:bg-blue-100";
                }

                return (
                  <button
                    key={index}
                    onClick={() => handleChoiceSelect(index)}
                    disabled={answered}
                    className={buttonClass}
                  >
                    <span className="font-semibold mr-2">
                      {String.fromCharCode(65 + index)}.
                    </span>
                    {choice}
                  </button>
                );
              })}
            </div>

            <div className="mt-6 text-center">
              <button
                onClick={handleSubmitAnswer}
                disabled={selectedChoice === null}
                className="bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white font-bold py-3 px-6 rounded-lg mr-4 transition-colors"
              >
                Submit Answer
              </button>

              <button
                onClick={resetQuiz}
                className="bg-black hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg transition-colors"
              >
                Give Up
              </button>
            </div>
          </div>
        )}

        {gameState === "result" && showResult && quizData && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-semibold">
                  {quizData.category}
                </span>
                <span
                  className={`font-bold ${getDifficultyColor(
                    quizData.difficulty
                  )}`}
                >
                  {getDifficultyStars(quizData.difficulty)} (
                  {quizData.difficulty}/5)
                </span>
              </div>

              <h3 className="text-xl font-semibold mb-6 text-gray-800 leading-relaxed">
                {quizData.question}
              </h3>
            </div>

            <div className="space-y-3 mb-6">
              {quizData.choices.map((choice, index) => {
                let buttonClass = "w-full p-4 text-left border-2 rounded-lg ";

                if (index === quizData.correctChoice - 1) {
                  buttonClass += "border-green-500 bg-green-100 text-green-800";
                } else if (index === selectedChoice) {
                  buttonClass += "border-red-500 bg-red-100 text-red-800";
                } else {
                  buttonClass += "border-gray-300 bg-gray-50 text-gray-600";
                }

                return (
                  <div key={index} className={buttonClass}>
                    <span className="font-semibold mr-2">
                      {String.fromCharCode(65 + index)}.
                    </span>
                    {choice}
                  </div>
                );
              })}
            </div>

            {selectedChoice === quizData.correctChoice - 1 ? (
              <div className="bg-green-100 border border-green-500 text-green-800 p-6 rounded-lg text-center mb-6">
                <h4 className="text-2xl font-bold mb-2">🎉 Correct!</h4>
                <p className="text-lg">
                  You won{" "}
                  <span className="font-bold">${calculatePotentialWin()}</span>!
                </p>
                <p className="text-sm">
                  Wager: ${wager} × Difficulty: {quizData.difficulty} = $
                  {calculatePotentialWin()}
                </p>
              </div>
            ) : (
              <div className="bg-red-100 border border-red-500 text-red-800 p-6 rounded-lg text-center mb-6">
                <h4 className="text-2xl font-bold mb-2">❌ Incorrect</h4>
                <p className="mb-2">
                  The correct answer was:{" "}
                  <span className="font-bold">
                    {String.fromCharCode(64 + quizData.correctChoice)}.{" "}
                    {quizData.choices[quizData.correctChoice - 1]}
                  </span>
                </p>
                <p className="text-lg">
                  You lost{" "}
                  <span className="font-bold">${calculatePotentialLoss()}</span>
                </p>
                <p className="text-sm">
                  Wager: ${wager} × Difficulty: {quizData.difficulty} = $
                  {calculatePotentialLoss()}
                </p>
              </div>
            )}

            <div className="text-center">
              <button
                onClick={() => {
                  if (money === 0) {
                    setGameState("gameOver");
                  } else {
                    sendMessage(input);
                    proceedToWagering();
                  }
                }}
                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg transition-colors"
              >
                {money === 0 ? "Back to Prompt" : "Next Question"}
              </button>
            </div>
          </div>
        )}

        {gameState === "gameOver" && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="text-center">
              <h2 className="text-4xl font-bold text-red-600 mb-4">
                💸 Game Over!
              </h2>
              <p className="text-xl text-gray-700 mb-6">
                You've lost all your money!
              </p>
              <div className="mb-6">
                <p className="text-lg text-gray-600">
                  Subject: <span className="font-semibold">{input}</span>
                </p>
              </div>
              <button
                onClick={resetQuiz}
                className="bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-8 rounded-lg text-lg transition-colors"
              >
                Start New Game
              </button>
            </div>
          </div>
        )}

        {/* {text && !quizData && (
          <div className="bg-white rounded-lg shadow-lg p-6 mt-6">
            <h3 className="text-lg font-semibold mb-2">Raw Response:</h3>
            <p className="text-gray-700 font-mono text-sm bg-gray-100 p-3 rounded">{text}</p>
          </div>
        )} */}
      </div>
    </div>
  );
}

export default App;
