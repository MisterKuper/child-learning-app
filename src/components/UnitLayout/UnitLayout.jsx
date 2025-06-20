import React, { useEffect, useState } from "react";
import "./UnitLayout.css";
import { useNavigate } from "react-router-dom";
import { db } from "../../config/firebase";
import {
  collection,
  getDocs,
  query,
  orderBy,
  doc,
  getDoc,
  setDoc,
} from "firebase/firestore";
import LoadingSpinner from "../LoadingSpinner/LoadingSpinner";
import { assets } from "../../assets/assets";
import { motion } from "framer-motion";

const UnitLayout = () => {
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [languageData, setLanguageData] = useState(null);
  const navigate = useNavigate();

  const userId = window.location.pathname.split("/")[2];

  const buttonPositions = [
    { row: 1, col: 4 },
    { row: 2, col: 3 },
    { row: 3, col: 3 },
    { row: 4, col: 4 },
    { row: 5, col: 5 },
    { row: 6, col: 6 },
    { row: 7, col: 6 },
    { row: 8, col: 5 },
    { row: 9, col: 4 },
    { row: 10, col: 4 },
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userDoc = await getDoc(doc(db, "users", userId));
        const lang = userDoc.data()?.language || "pl";

        const langDoc = await getDoc(doc(db, "languages", lang));
        const language = langDoc.data();
        setLanguageData(language);

        const unitsQuery = query(collection(db, "units"), orderBy("order"));
        const unitsSnapshot = await getDocs(unitsQuery);

        const unitPromises = unitsSnapshot.docs.map(async (unitDoc) => {
          const unit = unitDoc.data();
          const unitId = unitDoc.id;

          const [topicDoc, imageDoc] = await Promise.all([
            getDoc(doc(db, "languages", lang, "topic", unit.name_key)),
            getDoc(doc(db, "images", unit.name_key)),
          ]);

          const title = topicDoc.exists() ? topicDoc.data()?.name : "No name";
          const imageUrl = imageDoc.exists()
            ? imageDoc.data()?.mascot_img
            : null;

          const lessonsRef = collection(db, "units", unitId, "lessons");
          const lessonsQuery = query(lessonsRef, orderBy("order"));
          const lessonsSnapshot = await getDocs(lessonsQuery);

          const progressSnapshot = await getDocs(
            collection(
              db,
              "users",
              userId,
              "progress",
              unitId,
              "lessonsProgress"
            )
          );
          const progressMap = {};
          progressSnapshot.docs.forEach((doc) => {
            progressMap[doc.id] = doc.data();
          });

          const lessonPromises = lessonsSnapshot.docs.map(async (lessonDoc) => {
            const lessonData = lessonDoc.data();
            const lessonId = lessonDoc.id;
            const complete = progressMap[lessonId]?.complete || false;

            const tasksRef = collection(
              db,
              "units",
              unitId,
              "lessons",
              lessonId,
              "tasks"
            );
            const tasksSnapshot = await getDocs(tasksRef);
            const tasks = tasksSnapshot.docs.map((taskDoc) => ({
              id: taskDoc.id,
              ...taskDoc.data(),
            }));

            return { id: lessonId, ...lessonData, complete, tasks };
          });

          const lessons = await Promise.all(lessonPromises);

          const unitComplete =
            lessons.length > 0 && lessons.every((l) => l.complete);
          const unitProgressRef = doc(db, "users", userId, "progress", unitId);
          const unitProgressDoc = await getDoc(unitProgressRef);

          if (unitComplete) {
            if (
              !unitProgressDoc.exists() ||
              !unitProgressDoc.data()?.complete
            ) {
              await setDoc(
                unitProgressRef,
                { complete: true },
                { merge: true }
              );
            }
          } else {
            if (unitProgressDoc.exists() && unitProgressDoc.data()?.complete) {
              await setDoc(
                unitProgressRef,
                { complete: false },
                { merge: true }
              );
            }
          }

          return { id: unitId, title, imageUrl, lessons };
        });

        const rawUnits = await Promise.all(unitPromises);

        let allowNextUnit = true;
        const processedUnits = rawUnits.map((unit) => {
          let previousLessonComplete = true;
          const lessons = unit.lessons.map((lesson) => {
            const unlocked = allowNextUnit && previousLessonComplete;
            previousLessonComplete = lesson.complete;
            return { ...lesson, unlocked };
          });

          const unitComplete =
            lessons.length > 0 && lessons.every((l) => l.complete);
          const unlocked = allowNextUnit;
          allowNextUnit = unitComplete;

          return { ...unit, lessons, unlocked };
        });

        setUnits(processedUnits);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  if (loading || !languageData) return <LoadingSpinner />;
  if (error) return <div>Error: {error}</div>;

  const unitLabel = languageData.ui_text?.unit || "Unit";
  const startLabel = languageData.ui_text?.start_lesson || "Start";

  return (
    <div>
      <div>
        {units.length > 0 ? (
          units.map((unit, index) => (
            <div
              key={unit.id}
              className={`unit-layout unit-color-${index % 8}`}
            >
              <div
                className="unit-left-line"
                style={{ filter: unit.unlocked ? "none" : "grayscale(100%)" }}
              ></div>
              <div
                className="unit-right-line"
                style={{ filter: unit.unlocked ? "none" : "grayscale(100%)" }}
              ></div>

              <div className="unit-container">
                <div
                  className="unit-title-block"
                  style={{ filter: unit.unlocked ? "none" : "grayscale(100%)" }}
                >
                  <div className="unit-title">
                    <p className="top-part">
                      {unitLabel} {index + 1}:
                    </p>
                    <p>
                      <span>{unit.title}</span>
                    </p>
                  </div>
                  <div className="star-title-block">
                    <img
                      className="star-title"
                      src={
                        unit.lessons.every((l) => l.complete)
                          ? assets.star_gold_icon
                          : assets.star_gray_icon
                      }
                    />
                  </div>
                </div>

                <div className="image-container">
                  <img
                    className="mascot_image"
                    src={unit.imageUrl}
                    alt={unit.title}
                    style={{
                      filter: unit.unlocked ? "none" : "grayscale(100%)",
                    }}
                  />
                </div>

                <div className="button-container">
                  {unit.lessons.map((lesson, idx) => {
                    const pos =
                      buttonPositions[idx] ||
                      buttonPositions[buttonPositions.length - 1];
                    const isFinal = idx === unit.lessons.length - 1;
                    const firstAvailableIdx = unit.lessons.findIndex(
                      (lesson) => lesson.unlocked && !lesson.complete
                    );
                    const isFirstAvailable =
                      idx === firstAvailableIdx &&
                      lesson.unlocked &&
                      !lesson.complete;

                    return (
                      <div
                        key={lesson.id}
                        className="lesson-wrapper"
                        style={{
                          gridRow: pos.row,
                          gridColumn: pos.col,
                        }}
                      >
                        {isFirstAvailable && (
                          <>
                            <div className="start-bubble">{startLabel}</div>
                            <div className="highlight-ring-static" />
                          </>
                        )}
                        <button
                          className={`lesson-button unit-color-${index % 8} ${
                            isFinal ? "final" : ""
                          }`}
                          style={{
                            filter: lesson.unlocked
                              ? "none"
                              : "grayscale(100%)",
                            pointerEvents: lesson.unlocked ? "auto" : "none",
                          }}
                          onClick={() =>
                            navigate(
                              `/home/${userId}/unit/${unit.id}/lesson/${lesson.id}`
                            )
                          }
                          disabled={!lesson.unlocked}
                        >
                          {isFinal && (
                            <img
                              className="final-icon"
                              src={assets.star_white_icon}
                            />
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div>No units was found</div>
        )}
      </div>
      <div className="footer-container">
        <div className="images-wrapper">
          <motion.img
            src={assets.search_mascot_clouds}
            alt="Clouds"
            className="clouds"
            animate={{ x: [0, 40, -40, 0] }}
            transition={{
              duration: 25,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <img src={assets.search_mascot} alt="Mascot" className="mascot" />
        </div>

        <p className="search-text">
          {languageData?.ui_text?.searching_tasks ||
            "I'm looking for new tasks for you..."}
        </p>
      </div>
    </div>
  );
};

export default UnitLayout;
