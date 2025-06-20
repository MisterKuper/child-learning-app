import React, { useEffect, useRef, useState } from "react";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { assets } from "../../../assets/assets";
import "./PairingTask.css";
import LoadingSpinner from "../../LoadingSpinner/LoadingSpinner";

const shuffleArray = (array) => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

const PairingTask = ({
  unitId,
  lessonId,
  taskId,
  userId,
  onNext,
  updateTaskCompletion,
}) => {
  const db = getFirestore();
  const [taskData, setTaskData] = useState(null);
  const [wordData, setWordData] = useState({});
  const [imageData, setImageData] = useState({});
  const [wordAudioData, setWordAudioData] = useState({});
  const [shuffledImages, setShuffledImages] = useState([]);
  const [placedImages, setPlacedImages] = useState({});
  const [selectedImageKey, setSelectedImageKey] = useState(null);

  const [language, setLanguage] = useState("pl");
  const [nameKey, setNameKey] = useState("");
  const [instructionText, setInstructionText] = useState("");
  const [instructionAudio, setInstructionAudio] = useState(null);
  const [feedbackText, setFeedbackText] = useState({
    correct: "",
    incorrect: "",
  });
  const [uiText, setUiText] = useState({
    confirm: "Check",
    continue: "Continue",
    got_it: "Got it",
  });
  const [mascotUrl, setMascotUrl] = useState(null);

  const [feedbackState, setFeedbackState] = useState(null);
  const [showNextButton, setShowNextButton] = useState(false);
  const [incorrectKeys, setIncorrectKeys] = useState([]);

  const instructionAudioRef = useRef(null);
  const activeAudioRefs = useRef([]);
  const isUnmountedRef = useRef(false);

  const stopAllAudio = () => {
    activeAudioRefs.current.forEach((a) => {
      a.pause();
      a.currentTime = 0;
    });
    activeAudioRefs.current = [];
  };

  useEffect(() => {
    return () => {
      stopAllAudio();
      isUnmountedRef.current = true;
    };
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (!unitId || !lessonId || !taskId || !userId) return;

      const userSnap = await getDoc(doc(db, "users", userId));
      const lang = userSnap.data()?.language || "pl";
      setLanguage(lang);

      const langSnap = await getDoc(doc(db, `languages/${lang}`));
      setUiText(langSnap.data()?.ui_text || uiText);

      const instrSnap = await getDoc(
        doc(db, `languages/${lang}/task_types/pairing`)
      );
      const instrData = instrSnap.data();
      setInstructionText(instrData?.instruction_text || "");
      setInstructionAudio(instrData?.instruction_audio || null);
      setFeedbackText({
        correct: instrData?.feedback_correct_text || "",
        incorrect: instrData?.feedback_incorrect_text || "",
      });

      const mascotSnap = await getDoc(doc(db, "images/task_type_mascot"));
      setMascotUrl(mascotSnap.data()?.pairing_mascot || null);

      const unitSnap = await getDoc(doc(db, `units/${unitId}`));
      const unitNameKey = unitSnap.data()?.name_key;
      setNameKey(unitNameKey);

      const taskSnap = await getDoc(
        doc(db, `units/${unitId}/lessons/${lessonId}/tasks/${taskId}`)
      );
      const task = taskSnap.data();
      setTaskData(task);

      const wordSnap = await getDoc(
        doc(db, `languages/${lang}/words/${unitNameKey}`)
      );
      const allWords = wordSnap.data();

      const imageSnap = await getDoc(doc(db, `images/${unitNameKey}`));
      const images = imageSnap.data()?.cards || {};

      const selectedWords = {};
      const selectedImages = {};
      const audioData = {};

      for (const key of task.options_key) {
        selectedWords[key] = allWords[key];
        selectedImages[key] = images[key];
        audioData[key] = allWords[key]?.audio || null;
      }

      const allImageKeys = [
        ...new Set([...task.options_key, ...(task.image_options_key || [])]),
      ];

      setWordData(selectedWords);
      setImageData(selectedImages);
      setWordAudioData(audioData);
      setShuffledImages(shuffleArray(allImageKeys));
    };

    fetchData();
  }, [unitId, lessonId, taskId, userId]);

  useEffect(() => {
    if (!instructionAudio) return;

    const playWhenReady = () => {
      const audioEl = instructionAudioRef.current;

      if (audioEl) {
        audioEl
          .play()
          .then(() => {
            activeAudioRefs.current.push(audioEl);
            console.log("✅ Instruction audio started");
          })
          .catch((err) => {
            console.error("❌ Failed to play instruction audio:", err);
          });
      } else {
        console.warn("⚠️ Audio element not ready yet, retrying...");
        setTimeout(playWhenReady, 100);
      }
    };

    requestAnimationFrame(() => {
      setTimeout(playWhenReady, 100);
    });

    return () => {
    };
  }, [instructionAudio]);

  const handleDrop = (wordKey) => {
    if (!selectedImageKey) return;
    setPlacedImages((prev) => {
      const updated = { ...prev };
      Object.keys(updated).forEach((k) => {
        if (updated[k] === selectedImageKey) updated[k] = null;
      });
      updated[wordKey] = selectedImageKey;
      return updated;
    });
    setSelectedImageKey(null);
  };

  const handleImageSelect = (imgKey) => {
    setSelectedImageKey((prev) => (prev === imgKey ? null : imgKey));
  };

  const handleCheck = () => {
    stopAllAudio();
    const newPlacedImages = { ...placedImages };
    let allCorrect = true;
    const incorrect = [];

    taskData.options_key.forEach((wordKey) => {
      if (placedImages[wordKey] !== wordKey) {
        incorrect.push(wordKey);
        allCorrect = false;
      }
    });

    setIncorrectKeys(incorrect);
    setPlacedImages(newPlacedImages);
    setFeedbackState(allCorrect ? "correct" : "incorrect");
    setShowNextButton(allCorrect);

    const audio = new Audio(
      allCorrect ? assets.success_effect : assets.fail_effect
    );
    activeAudioRefs.current.push(audio);
    audio.play().catch(console.error);

    if (allCorrect) {
      updateTaskCompletion?.(taskId);
    }
  };

  const handleNext = () => {
    stopAllAudio();
    setFeedbackState(null);
    setShowNextButton(false);
    setIncorrectKeys([]);
    if (feedbackState === "correct") {
      onNext?.(true);
    }
  };

  const handleResetIncorrect = () => {
    setPlacedImages((prev) => {
      const updated = { ...prev };
      incorrectKeys.forEach((key) => {
        updated[key] = null;
      });
      return updated;
    });
    setIncorrectKeys([]);
    setFeedbackState(null);
  };

  const playAudio = (audioUrl) => {
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      activeAudioRefs.current.push(audio);
      audio.play().catch(console.error);
    }
  };

  const DropZone = ({ wordKey, word, imageKey, imageUrl, isIncorrect }) => {
    const handleClick = () => {
      if (imageKey) {
        setPlacedImages((prev) => {
          const updated = { ...prev };
          updated[wordKey] = null;
          return updated;
        });
      } else if (selectedImageKey) {
        handleDrop(wordKey);
      }
    };

    return (
      <div
        className={`drop-zone ${isIncorrect ? "drop-zone-incorrect" : ""}`}
        onClick={handleClick}
      >
        <div className={`option-info ${isIncorrect ? "option-incorrect" : ""}`}>
          <button
            className="audio-btn"
            onClick={(e) => {
              e.stopPropagation();
              playAudio(wordAudioData[wordKey]);
            }}
            disabled={!wordAudioData[wordKey]}
          >
            <img src={assets.audio_icon} alt="audio" />
          </button>
          <div className="word-text">{word?.text || wordKey}</div>
        </div>
        <div className="drop-zone-line"></div>
        <div className="drop-image">
          {imageKey && imageUrl && (
            <img src={imageUrl} alt="" className="drop-image-clickable" />
          )}
        </div>
      </div>
    );
  };

  const SelectableImage = ({ imageKey, imageUrl }) => {
    const isSelected = selectedImageKey === imageKey;
    return (
      <div
        className={`selectable-image ${isSelected ? "selected" : ""}`}
        onClick={() => handleImageSelect(imageKey)}
      >
        <img src={imageUrl} alt="" />
      </div>
    );
  };

  const availableImageKeys = shuffledImages.filter(
    (imgKey) => !Object.values(placedImages).includes(imgKey)
  );

  if (!taskData) return <LoadingSpinner />;

  return (
    <div className="pairing-task">
      <div className="task-header">
        {mascotUrl && (
          <img src={mascotUrl} alt="Mascot" className="mascot-img" />
        )}
        <h2 className="task-title">{instructionText}</h2>
      </div>

      <div className="divider-line-top"></div>

      <div>
        {taskData.options_key.map((wordKey) => (
          <DropZone
            key={wordKey}
            wordKey={wordKey}
            word={wordData[wordKey]}
            imageKey={placedImages[wordKey]}
            imageUrl={imageData[placedImages[wordKey]]}
            isIncorrect={incorrectKeys.includes(wordKey)}
          />
        ))}

        <div className="divider-line-bottom"></div>

        <div className="pool-zone">
          {availableImageKeys.map((imgKey) => (
            <SelectableImage
              key={imgKey}
              imageKey={imgKey}
              imageUrl={imageData[imgKey]}
            />
          ))}
        </div>
      </div>

      {!feedbackState && (
        <div className="confirm-section">
          <button
            onClick={handleCheck}
            className={`confirm-btn ${
              Object.keys(placedImages).length !== taskData.options_key.length
                ? "inactive"
                : "active"
            }`}
            disabled={
              Object.keys(placedImages).length !== taskData.options_key.length
            }
          >
            {uiText.confirm}
          </button>
        </div>
      )}

      {feedbackState && (
        <div className={`feedback-banner-global feedback-${feedbackState}`}>
          <div className="feedback-footer">
            <div className="feedback-info">
              <img
                src={
                  feedbackState === "correct"
                    ? assets.success_icon
                    : assets.fail_icon
                }
                alt={feedbackState}
              />
              <p>{feedbackState === "correct" ? "" : feedbackText.incorrect}</p>
            </div>
            <div className="confirm-section">
              {feedbackState === "correct" ? (
                <button onClick={handleNext} className="next-task-btn success">
                  {uiText.continue}
                </button>
              ) : (
                <button
                  onClick={handleResetIncorrect}
                  className="next-task-btn error"
                >
                  {uiText.got_it}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {instructionAudio && (
        <audio ref={instructionAudioRef} src={instructionAudio} />
      )}
    </div>
  );
};

export default PairingTask;
