import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";

export default function SharedQuiz() {
  const { quizId } = useParams();

  const [quiz, setQuiz] = useState([]);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    fetch(`http://localhost:5000/api/quiz/${quizId}`)
      .then((res) => res.json())
      .then((data) => setQuiz(data));
  }, [quizId]);

  const selectOption = (qIndex, optionIndex) => {
    if (submitted) return;

    setAnswers({
      ...answers,
      [qIndex]: optionIndex,
    });
  };

  const score = Object.entries(answers).reduce((acc, [qIdx, optionIdx]) => {
    if (quiz[qIdx] && optionIdx === quiz[qIdx].correctIndex) {
      return acc + 1;
    }

    return acc;
  }, 0);

  if (quiz.length === 0) {
    return <h2 style={{ padding: 40 }}>Loading quiz...</h2>;
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>Shared Quiz</h1>

      <ol>
        {quiz.map((q, i) => (
          <li key={i} style={{ marginBottom: 20 }}>
            <h3>{q.question}</h3>

            {q.options.map((o, j) => (
              <div
                key={j}
                onClick={() => selectOption(i, j)}
                style={{
                  padding: 8,
                  marginBottom: 5,
                  border: "1px solid #ccc",
                  cursor: submitted ? "default" : "pointer",

                  backgroundColor: !submitted
                    ? answers[i] === j
                      ? "#d0e8ff"
                      : "#f5f5f5"
                    : j === q.correctIndex
                      ? "#c8f7c5"
                      : answers[i] === j
                        ? "#ffb3b3"
                        : "#f5f5f5",
                }}
              >
                {o}
              </div>
            ))}
          </li>
        ))}
      </ol>

      {!submitted && (
        <button onClick={() => setSubmitted(true)} style={{ marginTop: 20 }}>
          Submit Quiz
        </button>
      )}

      {submitted && (
        <h2>
          Your Score: {score} / {quiz.length}
        </h2>
      )}
    </div>
  );
}
