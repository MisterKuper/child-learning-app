import React, { useEffect, useState, useRef } from "react";
import "./PairedPicturesTask.css";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { assets } from "../../../assets/assets";
import LoadingSpinner from "../../LoadingSpinner/LoadingSpinner";

const shuffleArray = (arr) => [...arr].sort(() => Math.random() - 0.5);

const PairedPicturesTask = ({ unitId, lessonId, taskId, userId, onNext }) => {
  const db = getFirestore();

  const [taskData, setTaskData] = useState(null);
  const [imageUrls, setImageUrls] = useState([]);
  const [cards, setCards] = useState([]);
  const [flipped, setFlipped] = useState([]);
  const [matched, setMatched] = useState([]);
  const [lock, setLock] = useState(true);
  const [initialPreview, setInitialPreview] = useState(true);
  const [instructionText, setInstructionText] = useState("");
  const [feedbackState, setFeedbackState] = useState(null);
  const [audioFiles, setAudioFiles] = useState({
    instruction: null,
    feedbackCorrect: null,
  });
  const [uiText, setUiText] = useState({ continue: "Continue" });
  const [language, setLanguage] = useState("pl");
  const [mascotUrl, setMascotUrl] = useState(null);

  const audioRef = useRef(null);
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

      try {
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
        const cardsMap = imageSnap.data()?.cards || {};
        const urls = task.options_key
          .map((key) => cardsMap[key])
          .filter(Boolean);

        setImageUrls(urls);

        if (urls.length === 0) {
          console.error("No images fo this task.");
          return;
        }

        const paired = shuffleArray([...urls, ...urls]).map((img, idx) => ({
          id: idx,
          image: img,
        }));
        setCards(paired);

        setTimeout(() => setLock(false), 3000);

        const langSnap = await getDoc(doc(db, `languages/${lang}`));
        setUiText(langSnap.data()?.ui_text || { continue: "Continue" });

        const instrSnap = await getDoc(
          doc(db, `languages/${lang}/task_types/paired_pictures`)
        );
        const instrData = instrSnap.data();
        setInstructionText(instrData?.instruction_text || "");
        setAudioFiles({
          instruction: instrData?.instruction_audio || null,
          feedbackCorrect: instrData?.feedback_correct_audio || null,
        });

        const mascotSnap = await getDoc(doc(db, "images/task_type_mascot"));
        setMascotUrl(mascotSnap.data()?.paired_pictures_mascot || null);
      } catch (err) {
        console.error("Error:", err);
      }
    };

    fetchData();
  }, [unitId, lessonId, taskId, userId]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setInitialPreview(false);
      setLock(false);
    }, 5000);

    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (audioFiles.instruction && audioRef.current) {
      activeAudioRefs.current.push(audioRef.current);
      audioRef.current.play();
    }
  }, [audioFiles.instruction]);

  const handleFlip = (idx) => {
    if (lock || flipped.includes(idx) || matched.includes(idx)) return;
    const newFlipped = [...flipped, idx];
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      setLock(true);
      setTimeout(() => {
        const [i1, i2] = newFlipped;
        if (cards[i1].image === cards[i2].image) {
          const newMatched = [...matched, i1, i2];
          setMatched(newMatched);
          if (newMatched.length === cards.length) {
            const feedbackAudio = new Audio(audioFiles.feedbackCorrect);
            const successAudio = new Audio(assets.success_effect);

            activeAudioRefs.current.push(feedbackAudio, successAudio);
            feedbackAudio.play();
            successAudio.play();

            setFeedbackState("correct");
          }
        }
        setFlipped([]);
        setLock(false);
      }, 1000);
    }
  };

  const handleNext = () => {
    stopAllAudio();
    onNext?.(true);
  };

  if (!taskData) {
    return (
      <div>
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="paired-pictures-task">
      <div className="task-header">
        {mascotUrl && <img src={mascotUrl} alt="Mascot" />}
        <h2 className="task-title">{instructionText}</h2>
      </div>

      <div className="divider-line-top"></div>

      <div className="task-body">
        <div className="paired-grid">
          {cards.map((card, idx) => {
            const isFlipped =
              initialPreview || flipped.includes(idx) || matched.includes(idx);
            return (
              <div
                key={card.id}
                className={`card ${isFlipped ? "flipped" : ""}`}
                onClick={() => handleFlip(idx)}
              >
                <div className="card-inner">
                  <div className="card-front">
                    <img src={card.image} alt="card" />
                  </div>
                  <div className="card-back" />
                </div>
              </div>
            );
          })}
        </div>

        {feedbackState && (
          <div className={`feedback-banner-global feedback-${feedbackState}`}>
            <div className="feedback-footer">
              <div className="feedback-info">
                <img src={assets.success_icon} alt="success" />
              </div>
              <div className="confirm-section">
                <button onClick={handleNext} className="next-task-btn success">
                  {uiText.continue}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <audio ref={audioRef} src={audioFiles.instruction}></audio>
    </div>
  );
};

export default PairedPicturesTask;
