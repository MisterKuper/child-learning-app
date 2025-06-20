import { db } from "../config/firebase";
import { doc, setDoc, getDocs, getDoc, collection } from "firebase/firestore";

export const syncUserProgress = async (userId) => {
  const unitsSnap = await getDocs(collection(db, "units"));

  for (const unitDoc of unitsSnap.docs) {
    const unitId = unitDoc.id;
    const unitProgressRef = doc(db, "users", userId, "progress", unitId);
    const unitProgressSnap = await getDoc(unitProgressRef);

    // create new unit progress
    if (!unitProgressSnap.exists()) {
      await setDoc(unitProgressRef, { unitId, complete: false });
    }

    const lessonsSnap = await getDocs(collection(db, "units", unitId, "lessons"));
    for (const lessonDoc of lessonsSnap.docs) {
      const lessonId = lessonDoc.id;
      const lessonProgressRef = doc(unitProgressRef, "lessonsProgress", lessonId);
      const lessonProgressSnap = await getDoc(lessonProgressRef);

      if (!lessonProgressSnap.exists()) {
        await setDoc(lessonProgressRef, { lessonId, complete: false });
      }

      const tasksSnap = await getDocs(collection(db, "units", unitId, "lessons", lessonId, "tasks"));
      for (const taskDoc of tasksSnap.docs) {
        const taskId = taskDoc.id;
        const taskProgressRef = doc(lessonProgressRef, "tasksProgress", taskId);
        const taskProgressSnap = await getDoc(taskProgressRef);

        if (!taskProgressSnap.exists()) {
          await setDoc(taskProgressRef, { taskId, complete: false });
        }
      }
    }
  }
};
