import React, { useEffect, useState, useRef } from "react";
import "./OneChoiceTask.css";
import { db } from "../../../config/firebase";
import { doc, getDoc } from "firebase/firestore";
import { assets } from "../../../assets/assets";
import LoadingSpinner from "../../LoadingSpinner/LoadingSpinner";

const OneChoiceTask = ({
  unitId,
  lessonId,
  taskId,
  userId,
  updateTaskCompletion,
  onNext,
}) => {
  const [taskData, setTaskData] = useState(null);
  const [options, setOptions] = useState([]);
  const [selectedOption, setSelectedOption] = useState(null);
  const [feedbackState, setFeedbackState] = useState(null);
  const [showNextButton, setShowNextButton] = useState(false);
  const [continueText, setContinueText] = useState("");
  const [confirmText, setConfirmText] = useState("");

  const [instructionText, setInstructionText] = useState("");
  const [correctText, setCorrectText] = useState("");
  const [feedbackText, setFeedbackText] = useState("");
  const [mascotUrl, setMascotUrl] = useState(null);

  const [audios, setAudios] = useState({
    correct: null,
    instruction: null,
    correctOption: null,
    feedbackCorrect: null,
    feedbackIncorrect: null,
  });

  const instructionAudioRef = useRef(null);
  const correctAudioRef = useRef(null);
  const activeAudioRefs = useRef([]);
  const feedbackAudioTimeoutRef = useRef(null);
  const isComponentUnmountedRef = useRef(false);

  const stopAllAudio = () => {
    activeAudioRefs.current.forEach((audio) => {
      audio.pause();
      audio.currentTime = 0;
    });
    activeAudioRefs.current = [];

    if (feedbackAudioTimeoutRef.current) {
      clearTimeout(feedbackAudioTimeoutRef.current);
      feedbackAudioTimeoutRef.current = null;
    }
  };

  useEffect(() => {
    isComponentUnmountedRef.current = false;
    return () => {
      stopAllAudio();
      isComponentUnmountedRef.current = true;
    };
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!unitId || !lessonId || !userId) return;

        const userSnap = await getDoc(doc(db, "users", userId));
        const language = userSnap.data()?.language || "pl";

        const langDoc = await getDoc(doc(db, "languages", language));
        const langData = langDoc.data();

        setConfirmText(langData?.ui_text?.confirm || "Check");
        setContinueText(langData?.ui_text?.continue || "Continue");

        const taskSnap = await getDoc(
          doc(db, "units", unitId, "lessons", lessonId, "tasks", taskId)
        );
        const task = taskSnap.data();
        setTaskData(task);

        const instrSnap = await getDoc(
          doc(db, "languages", language, "task_types", task.type)
        );
        const instr = instrSnap.data();
        setInstructionText(instr?.instruction_text || "");
        setFeedbackText({
          correct: instr?.feedback_correct_text || "",
          incorrect: instr?.feedback_incorrect_text || "",
        });

        setAudios({
          correct: null,
          instruction: instr?.instruction_audio || null,
          correctOption: null,
          feedbackCorrect: instr?.feedback_correct_audio || null,
          feedbackIncorrect: instr?.feedback_incorrect_audio || null,
        });

        
        const unitSnap = await getDoc(doc(db, "units", unitId));
        const nameKey = unitSnap.data().name_key;
        
        const wordSnap = await getDoc(
          doc(db, "languages", language, "words", nameKey)
        );
        const wordData = wordSnap.data();
        
        const mascotSnap = await getDoc(doc(db, "images", "task_type_mascot"));
        setMascotUrl(mascotSnap.data()?.[`${task.type}_mascot`] || null);
        
        const imageSnap = await getDoc(doc(db, "images", nameKey));
        const imageData = imageSnap.data();

        const parsedOptions = task.options_key.map((key, idx) => ({
          key,
          text: wordData[key]?.text || key,
          audio: wordData[key]?.audio || null,
          correct: idx === task.answer,
          imageUrl: imageData.cards?.[key] || null,
          audio_find: wordData[key]?.audio_find || null,
        }));

        setOptions(parsedOptions);
        setCorrectText(parsedOptions[task.answer]?.text || "");
        setAudios((prev) => ({
          ...prev,
          correct: parsedOptions[task.answer]?.audio || null,
          correctOption: parsedOptions[task.answer]?.audio_find || null,
        }));
      } catch (err) {
        console.error("Error:", err);
      }
    };

    fetchData();
  }, [unitId, lessonId, taskId, userId]);

  useEffect(() => {
    const playAudioSequence = async () => {
      try {
        stopAllAudio();

        if (audios.instruction && instructionAudioRef.current) {
          activeAudioRefs.current.push(instructionAudioRef.current);
          instructionAudioRef.current.play();

          await new Promise((resolve) => {
            instructionAudioRef.current.onended = resolve;
          });
        }

        if (audios.correctOption) {
          const correctAudio = new Audio(audios.correctOption);
          activeAudioRefs.current.push(correctAudio);
          await correctAudio.play();
        }
      } catch (err) {
        console.error("Error:", err);
      }
    };

    playAudioSequence();
  }, [audios.instruction, audios.correctOption]);

  const handleOptionSelect = (index) => {
    setSelectedOption(index === selectedOption ? null : index);
  };

  const handleSubmit = async () => {
    if (selectedOption === null || feedbackState) return;

    stopAllAudio();

    const chosen = options[selectedOption];
    const isCorrect = chosen.correct;

    console.log("Chosen option:", chosen);
    console.log(
      "Feedback audio:",
      isCorrect ? audios.feedbackCorrect : audios.feedbackIncorrect
    );
    console.log("Option audio:", chosen.audio);

    setFeedbackState(isCorrect ? "correct" : "incorrect");
    setShowNextButton(true);

    if (isCorrect) updateTaskCompletion(taskId);

    const feedbackEffect = new Audio(
      isCorrect ? assets.success_effect : assets.fail_effect
    );
    activeAudioRefs.current.push(feedbackEffect);
    feedbackEffect.play().catch(console.error);

    feedbackEffect.onended = () => {
      if (!isComponentUnmountedRef.current) {
        const feedbackAudio = new Audio(
          isCorrect ? audios.feedbackCorrect : audios.feedbackIncorrect
        );
        activeAudioRefs.current.push(feedbackAudio);
        feedbackAudio.play().catch(console.error);

        feedbackAudioTimeoutRef.current = setTimeout(() => {
          if (chosen.audio) {
            const optionAudio = new Audio(chosen.audio);
            activeAudioRefs.current.push(optionAudio);
            optionAudio.play().catch(console.error);
          }
        }, 1500);
      }
    };
  };

  const handleNext = () => {
    stopAllAudio();

    setSelectedOption(null);
    setFeedbackState(null);
    setShowNextButton(false);
    onNext(feedbackState === "correct");
  };

  const playCorrectAudio = () => {
    stopAllAudio();
    if (correctAudioRef.current) {
      activeAudioRefs.current.push(correctAudioRef.current);
      correctAudioRef.current.play().catch(console.error);
    }
  };

  if (!taskData || options.length === 0) {
    return (
      <div>
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="one-choice-task">
      <h2 className="task-title">{instructionText}</h2>

      <div className="task-header">
        {mascotUrl && (
          <img src={mascotUrl} alt="Mascot" className="mascot-img" />
        )}
        {audios.correct && (
          <div className="task-text">
            <button onClick={playCorrectAudio}>
              <img src={assets.audio_icon} alt="Play audio" />
            </button>
            <p>{correctText}</p>
          </div>
        )}
        <audio ref={correctAudioRef} src={audios.correct} />
        <audio ref={instructionAudioRef} src={audios.instruction} />
      </div>

      <div className="divider-line-top"></div>

      <div className="options-section">
        {options.map((option, index) => (
          <div
            key={index}
            onClick={() => handleOptionSelect(index)}
            className={`option ${selectedOption === index ? "selected" : ""}`}
          >
            <img
              src={option.imageUrl}
              alt={option.text}
              className="option-img"
            />
          </div>
        ))}
      </div>

      <div className="divider-line-bottom"></div>

      {!feedbackState && (
        <div className="confirm-section">
          <button
            onClick={handleSubmit}
            className={`confirm-btn ${
              selectedOption === null ? "inactive" : "active"
            }`}
            disabled={selectedOption === null}
          >
            {confirmText}
          </button>
        </div>
      )}

      {feedbackState && (
        <div className={`feedback-banner-global feedback-${feedbackState}`}>
          <div className="feedback-footer">
            <div className="feedback-content">
              <div className="feedback-info">
                <img
                  src={
                    feedbackState === "correct"
                      ? assets.success_icon
                      : assets.fail_icon
                  }
                  alt={feedbackState}
                  className="w-6 h-6"
                />
                <div className="feedback-text">
                  <p>
                    {feedbackState === "correct"
                      ? feedbackText.correct
                      : feedbackText.incorrect}
                  </p>
                  <span>{options[selectedOption]?.text}</span>
                </div>
              </div>
            </div>

            {showNextButton && (
              <div className="confirm-section">
                <button
                  onClick={handleNext}
                  className={`next-task-btn ${
                    feedbackState === "correct" ? "correct" : "incorrect"
                  }`}
                >
                  {continueText}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default OneChoiceTask;
