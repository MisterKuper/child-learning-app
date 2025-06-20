import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { assets } from "../../assets/assets";
import { db } from "../../config/firebase";
import { doc, getDoc } from "firebase/firestore";
import "./CompleteLessonScreen.css";
import { motion } from "framer-motion";

const CompleteLessonScreen = () => {
  const [randomMessage, setRandomMessage] = useState("");
  const [uiText, setUiText] = useState({});
  const navigate = useNavigate();
  const { userId } = useParams();
  const audioRef = useRef(null);

  useEffect(() => {
    const fetchLocalization = async () => {
      try {
        const userDoc = await getDoc(doc(db, "users", userId));
        const userData = userDoc.data();
        const lang = userData.language || "pl";

        const langDoc = await getDoc(doc(db, "languages", lang));
        const languageData = langDoc.exists()
          ? langDoc.data().ui_text || {}
          : {};

        setUiText(languageData);

        const congratsMessages = languageData.lesson_complete_messages || [
          "Congratulations! You've completed the lesson!",
        ];
        const randomIndex = Math.floor(Math.random() * congratsMessages.length);
        setRandomMessage(congratsMessages[randomIndex]);
      } catch (error) {
        console.error("Error loading localization:", error);
        setRandomMessage("Congratulations! You've completed the lesson!");
      }
    };

    fetchLocalization();
  }, [userId]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.play().catch((err) => {
        console.warn("Autoplay blocked", err);
      });
    }
  }, []);

  const handleGoHome = () => {
    navigate(`/home/${userId}`);
  };

  return (
    <div className="complete-lesson-screen">
      <div className="mascot-and-text-wrapper">
        <div className="circus-rays-background" />

        <div className="mascot-on-box">
          <motion.img
            src={assets.jump_mascot}
            alt="Mascot"
            className="jumping-mascot"
            initial={{ y: 80, opacity: 1 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />
          <div className="congrats-box">
            <p className="congrats-message">{randomMessage}</p>
          </div>
        </div>
      </div>

      <button onClick={handleGoHome} className="home-btn">
        {uiText.finish_lesson || "Finish Lesson"}
      </button>
      <audio ref={audioRef} src={assets.lesson_complete} />
    </div>
  );
};

export default CompleteLessonScreen;
