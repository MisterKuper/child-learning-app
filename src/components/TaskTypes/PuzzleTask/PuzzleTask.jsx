import React, { useEffect, useState, useRef } from "react";
import "./PuzzleTask.css";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { assets } from "../../../assets/assets";
import LoadingSpinner from "../../LoadingSpinner/LoadingSpinner";

const PuzzleTask = ({
  unitId,
  lessonId,
  taskId,
  userId,
  onNext,
  updateTaskCompletion,
}) => {
  const db = getFirestore();

  const [taskData, setTaskData] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [pieces, setPieces] = useState([]);
  const [gridSize, setGridSize] = useState(3);
  const [placed, setPlaced] = useState({});
  const [completed, setCompleted] = useState(false);
  const [selectedPiece, setSelectedPiece] = useState(null);

  const [language, setLanguage] = useState("pl");
  const [instructionText, setInstructionText] = useState("");
  const [feedbackState, setFeedbackState] = useState(null);
  const [uiText, setUiText] = useState({ continue: "Continue" });
  const [audioFiles, setAudioFiles] = useState({
    instruction: null,
    feedbackCorrect: null,
  });
  const [mascotUrl, setMascotUrl] = useState(null);

  const audioRef = useRef(null);
  const successEffectRef = useRef(null);
  const activeAudioRefs = useRef([]);

  const stopAllAudio = () => {
    activeAudioRefs.current.forEach((audio) => {
      audio.pause();
      audio.currentTime = 0;
    });
    activeAudioRefs.current = [];
  };

  useEffect(() => {
    return () => stopAllAudio();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (!unitId || !lessonId || !taskId || !userId) return;

      const userSnap = await getDoc(doc(db, "users", userId));
      const lang = userSnap.data()?.language || "pl";
      setLanguage(lang);

      const unitSnap = await getDoc(doc(db, `units/${unitId}`));
      const nameKey = unitSnap.data()?.name_key;

      const taskSnap = await getDoc(
        doc(db, `units/${unitId}/lessons/${lessonId}/tasks/${taskId}`)
      );
      const task = taskSnap.data();
      setTaskData(task);

      const imageSnap = await getDoc(doc(db, `images/${nameKey}`));
      const url = imageSnap.data()?.[task.image_key];
      if (!url) return;
      setImageUrl(url);

      const size = (task.difficulty || 1) + 2;
      setGridSize(size);

      const indexes = Array.from({ length: size * size }, (_, i) => i);
      setPieces(indexes.sort(() => Math.random() - 0.5));

      const langSnap = await getDoc(doc(db, `languages/${lang}`));
      setUiText(langSnap.data()?.ui_text || { continue: "Continue" });

      const instrSnap = await getDoc(
        doc(db, `languages/${lang}/task_types/puzzle`)
      );
      const instrData = instrSnap.data();
      setInstructionText(instrData?.instruction_text || "");
      setAudioFiles({
        instruction: instrData?.instruction_audio || null,
        feedbackCorrect: instrData?.feedback_correct_audio || null,
      });

      const mascotSnap = await getDoc(doc(db, "images/task_type_mascot"));
      setMascotUrl(mascotSnap.data()?.puzzle_mascot || null);
    };

    fetchData();
  }, [unitId, lessonId, taskId, userId]);

  useEffect(() => {
    if (audioFiles.instruction && audioRef.current) {
      activeAudioRefs.current.push(audioRef.current);
      audioRef.current.play();
    }
  }, [audioFiles.instruction]);

  const handleDrop = (index, piece) => {
    setPlaced((prev) => {
      const newPlaced = Object.fromEntries(
        Object.entries(prev).filter(([_, val]) => val !== piece)
      );

      newPlaced[index] = piece;

      const isComplete =
        Object.keys(newPlaced).length === gridSize * gridSize &&
        Object.entries(newPlaced).every(
          ([cellIndex, pieceIndex]) => parseInt(cellIndex) === pieceIndex
        );

      setCompleted(isComplete);
      return newPlaced;
    });
  };

  const renderPiece = (pieceIndex) => {
    const row = Math.floor(pieceIndex / gridSize);
    const col = pieceIndex % gridSize;
    const backgroundPosition = `${(col / (gridSize - 1)) * 100}% ${
      (row / (gridSize - 1)) * 100
    }%`;

    const isSelected = selectedPiece === pieceIndex;

    return (
      <div
        key={pieceIndex}
        className={`puzzle-piece ${isSelected ? "selected" : ""}`}
        onClick={() => {
          setSelectedPiece(pieceIndex === selectedPiece ? null : pieceIndex);
        }}
        style={{
          backgroundImage: `url(${imageUrl})`,
          backgroundSize: `${gridSize * 100}%`,
          backgroundPosition,
          border: isSelected ? "3px solid var(--primary-color)" : "none",
        }}
      />
    );
  };

  const renderCell = (index) => {
    const piece = placed[index];
    return (
      <div
        key={index}
        className="puzzle-cell"
        onClick={() => {
          if (selectedPiece === null) return;

          handleDrop(index, selectedPiece);
          setSelectedPiece(null);
        }}
      >
        {piece !== undefined && renderPiece(piece)}
      </div>
    );
  };

  const handleNext = () => {
    stopAllAudio();
    setFeedbackState(null);
    onNext?.(true);
  };

  useEffect(() => {
    if (completed) {
      stopAllAudio();

      const feedbackAudio = new Audio(audioFiles.feedbackCorrect);
      const successEffect = successEffectRef.current;

      if (feedbackAudio) {
        activeAudioRefs.current.push(feedbackAudio);
        feedbackAudio.play();
      }

      if (successEffect) {
        activeAudioRefs.current.push(successEffect);
        successEffect.play();
      }

      setFeedbackState("correct");
    }
  }, [completed]);

  if (!taskData || !imageUrl) return <LoadingSpinner />;

  return (
    <div className="puzzle-task">
      <div className="task-header">
        {mascotUrl && <img src={mascotUrl} alt="Mascot" />}
        <h2 className="task-title">{instructionText}</h2>
      </div>

      <div className="divider-line-top"></div>

      <div className="task-body">
        <div className="puzzle-left">
          <div className="puzzle-grid">
            {pieces.map((piece, i) => (
              <div key={i} className="puzzle-cell">
                {!Object.values(placed).includes(piece) && renderPiece(piece)}
              </div>
            ))}
          </div>
        </div>

        <div className="arrow-image">
          <img src={assets.arrow_icon} alt="arrow" />
        </div>

        <div className="puzzle-right">
          <div
            className="puzzle-grid"
            style={{
              gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
              gridTemplateRows: `repeat(${gridSize}, 1fr)`,
            }}
          >
            {Array.from({ length: gridSize * gridSize }, (_, i) =>
              renderCell(i)
            )}
          </div>

          {feedbackState && (
            <div className={`feedback-banner-global feedback-${feedbackState}`}>
              <div className="feedback-footer">
                <div className="feedback-info">
                  <img src={assets.success_icon} alt="success" />
                </div>
                <div className="confirm-section">
                  <button
                    onClick={handleNext}
                    className="next-task-btn success"
                  >
                    {uiText.continue}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <audio ref={audioRef} src={audioFiles.instruction}></audio>
      <audio ref={successEffectRef} src={assets.success_effect}></audio>
    </div>
  );
};

export default PuzzleTask;
