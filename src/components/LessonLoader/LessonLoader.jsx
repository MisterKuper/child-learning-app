import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { db } from "../../config/firebase";
import {
  collection,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";
import { assets } from "../../assets/assets";
import { motion } from "framer-motion";
import "./LessonLoader.css";

const LessonLoader = () => {
  const { userId, unitId, lessonId } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

useEffect(() => {
  const fetchLessonAndProgress = async () => {
    const delay = new Promise(resolve => setTimeout(resolve, 5000));

    try {
      const lessonRef = doc(db, "units", unitId, "lessons", lessonId);
      const lessonDoc = await getDoc(lessonRef);

      if (!lessonDoc.exists()) {
        setError("Lesson not found.");
        return;
      }

      const tasksRef = collection(db, "units", unitId, "lessons", lessonId, "tasks");
      const tasksSnapshot = await getDocs(tasksRef);

      if (tasksSnapshot.empty) {
        setError("Task not found");
        return;
      }

      const allTasks = tasksSnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
        }))
        .filter(task => typeof task.order === "number")
        .sort((a, b) => a.order - b.order);

      const progressRef = collection(
        db,
        "users",
        userId,
        "progress",
        unitId,
        "lessonsProgress",
        lessonId,
        "tasksProgress"
      );

      const progressSnapshot = await getDocs(progressRef);
      const completedTaskIds = new Set(
        progressSnapshot.docs
          .filter(doc => doc.data().complete)
          .map(doc => doc.id)
      );

      const uncompletedTasks = allTasks.filter(task => !completedTaskIds.has(task.id));

      await delay;

      if (uncompletedTasks.length > 0) {
        navigate(`/home/${userId}/unit/${unitId}/lesson/${lessonId}/task/${uncompletedTasks[0].id}`);
      } else {
        navigate(`/home/${userId}/complete`);
      }

    } catch (err) {
      console.error("Error:", err);
      setError("Error");
    } finally {
      setLoading(false);
    }
  };

  fetchLessonAndProgress();
}, [unitId, lessonId, userId, navigate]);


if (loading) {
  return (
    <div className="loader-wrapper">
      <motion.div
        className="orbit-container"
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
      >
        <motion.img
          src={assets.airplane_mascot}
          alt="Flying..."
          className="orbiting-plane"
          animate={{ rotate: 180 }}
          transition={{ repeat: Infinity, duration: 80, ease: "linear" }}
        />
      </motion.div>
      <p>Loading Lesson...</p>
    </div>
  );
}




  if (error) return <div>{error}</div>;

  return null;
};

export default LessonLoader;
