import React, { useEffect, useState } from "react";
import "./TaskLayout.css";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../../config/firebase";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  getDoc,
  setDoc,
} from "firebase/firestore";

import OneChoiceTask from "../TaskTypes/OneChoiceTask/OneChoiceTask";
import PairedPicturesTask from "../TaskTypes/PairedPicturesTask/PairedPicturesTask";
import PairingTask from "../TaskTypes/PairingTask/PairingTask";
import PuzzleTask from "../TaskTypes/PuzzleTask/PuzzleTask";
import { assets } from "../../assets/assets";

import { AnimatePresence, motion } from "framer-motion";
import LoadingSpinner from "../LoadingSpinner/LoadingSpinner";

const TaskLayout = () => {
  const { unitId, lessonId, userId, taskId } = useParams();
  const navigate = useNavigate();

  const [allTasks, setAllTasks] = useState([]);
  const [playQueue, setPlayQueue] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [completedSet, setCompletedSet] = useState(new Set());
  const [isRetry, setIsRetry] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const currentTask = playQueue[currentIdx];

  useEffect(() => {
    (async () => {
      if (!unitId || !lessonId || !userId) {
        setError("Wrong path");
        setLoading(false);
        return;
      }

      try {
        const tasksSnap = await getDocs(
          collection(db, "units", unitId, "lessons", lessonId, "tasks")
        );
        const tasksData = tasksSnap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((t) => typeof t.order === "number")
          .sort((a, b) => a.order - b.order);
        setAllTasks(tasksData);

        const progSnap = await getDocs(
          collection(
            db,
            "users",
            userId,
            "progress",
            unitId,
            "lessonsProgress",
            lessonId,
            "tasksProgress"
          )
        );

        const done = new Set();
        progSnap.forEach((d) => {
          if (d.data().complete) done.add(d.id);
        });
        setCompletedSet(done);

        const retryQueue = tasksData.filter((task) => !done.has(task.id));
        setPlayQueue(retryQueue);

        const idx = retryQueue.findIndex((t) => t.id === taskId);
        if (idx >= 0) {
          setCurrentIdx(idx);
        } else if (retryQueue.length > 0) {
          navigate(
            `/home/${userId}/unit/${unitId}/lesson/${lessonId}/task/${retryQueue[0].id}`,
            { replace: true }
          );
        } else {
          navigate(`/home/${userId}/complete`);
        }
      } catch (e) {
        console.error(e);
        setError("Error in loading task");
      } finally {
        setLoading(false);
      }
    })();
  }, [unitId, lessonId, userId, taskId, navigate]);

  const markComplete = async (id) => {
    const ref = doc(
      db,
      "users",
      userId,
      "progress",
      unitId,
      "lessonsProgress",
      lessonId,
      "tasksProgress",
      id
    );
    const snap = await getDoc(ref);
    if (snap.exists()) await updateDoc(ref, { complete: true });
    else await setDoc(ref, { complete: true });
  };

  const markLessonComplete = async () => {
    const userLessonRef = doc(
      db,
      "users",
      userId,
      "progress",
      unitId,
      "lessonsProgress",
      lessonId
    );

    const snap = await getDoc(userLessonRef);
    if (snap.exists()) {
      await updateDoc(userLessonRef, { complete: true });
    } else {
      await setDoc(userLessonRef, { complete: true });
    }
  };

  const resetTasksProgress = async () => {
    const tasksProgressSnap = await getDocs(
      collection(
        db,
        "users",
        userId,
        "progress",
        unitId,
        "lessonsProgress",
        lessonId,
        "tasksProgress"
      )
    );

    const resetPromises = tasksProgressSnap.docs.map((docSnap) =>
      updateDoc(docSnap.ref, { complete: false })
    );

    await Promise.all(resetPromises);
  };

  const goNext = async (wasCorrect) => {
    if (!currentTask) return;
    const id = currentTask.id;

    const taskRef = doc(
      db,
      "users",
      userId,
      "progress",
      unitId,
      "lessonsProgress",
      lessonId,
      "tasksProgress",
      id
    );

    if (!wasCorrect && !isRetry) {
      const snap = await getDoc(taskRef);
      if (snap.exists()) {
        await updateDoc(taskRef, { complete: false });
      } else {
        await setDoc(taskRef, { complete: false });
      }
    }

    if (wasCorrect && !isRetry) {
      await markComplete(id);
      setCompletedSet((prev) => new Set([...prev, id]));
    }

    const nextIdx = currentIdx + 1;
    if (nextIdx < playQueue.length) {
      setCurrentIdx(nextIdx);
      navigate(
        `/home/${userId}/unit/${unitId}/lesson/${lessonId}/task/${playQueue[nextIdx].id}`
      );
      return;
    }

    // Correcting wrong tasks
    if (!isRetry) {
      try {
        const progSnap = await getDocs(
          collection(
            db,
            "users",
            userId,
            "progress",
            unitId,
            "lessonsProgress",
            lessonId,
            "tasksProgress"
          )
        );
        const actualCompleted = new Set();
        progSnap.forEach((d) => {
          if (d.data().complete) actualCompleted.add(d.id);
        });

        const retryQueue = allTasks.filter(
          (task) => !actualCompleted.has(task.id)
        );

        if (retryQueue.length > 0) {
          setIsRetry(true);
          setPlayQueue(retryQueue);
          setCurrentIdx(0);
          navigate(
            `/home/${userId}/unit/${unitId}/lesson/${lessonId}/task/${retryQueue[0].id}`
          );
          return;
        }
      } catch (e) {
        console.error("Error:", e);
      }
    }

    // All tasks complete
    await markLessonComplete();
    await resetTasksProgress();
    navigate(`/home/${userId}/complete`);
  };

  const renderByType = () => {
    if (!currentTask) return <div>Task not found</div>;
    const props = {
      ...currentTask,
      unitId,
      lessonId,
      userId,
      taskId: currentTask.id,
      updateTaskCompletion: () => markComplete(currentTask.id),
      onNext: goNext,
    };
    switch (currentTask.type) {
      case "one_choice":
        return <OneChoiceTask {...props} />;
      case "paired_pictures":
        return <PairedPicturesTask {...props} />;
      case "pairing":
        return <PairingTask {...props} />;
      case "puzzle":
        return <PuzzleTask {...props} />;
      default:
        return <div>Unknown type: {currentTask.type}</div>;
    }
  };

  const progress =
    allTasks.length === 0
      ? 0
      : Math.round((completedSet.size / allTasks.length) * 100);

  if (loading) return <div><LoadingSpinner /></div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="task-layout">
      <div className="task-layout-header">
        <img
          src={assets.cross_icon}
          alt="Exit"
          className="exit-btn"
          onClick={async () => {
            await resetTasksProgress();
            navigate(`/home/${userId}`);
          }}
        />
        <div className="progress-bar-wrapper">
          <div
            className="progress-bar-fill"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
      <div className="task-layout-content">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentTask?.id}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.5 }}
          >
            {renderByType()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default TaskLayout;
