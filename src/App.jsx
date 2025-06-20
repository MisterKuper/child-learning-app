import React from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import Welcome from "./pages/Welcome/Welcome.jsx";
import Authentication from "./pages/Authentication/Authentication.jsx";
import Home from "./pages/Home/Home.jsx";
import LessonLoader from "./components/LessonLoader/LessonLoader.jsx";
import TaskLayout from "./components/TaskLayout/TaskLayout.jsx";
import CompleteLessonScreen from "./components/CompleteLessonScreen/CompleteLessonScreen.jsx";
import SettingsPage from "./pages/Settings/SettingsPage.jsx";
import Terms from "./pages/Docs/Terms/Terms.jsx";
import Privacy from "./pages/Docs/Privacy/Privacy.jsx";

function App() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.key}>
        <Route
          path="/"
          element={
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Welcome />
            </motion.div>
          }
        />
        <Route
          path="/auth/login"
          element={
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Authentication />
            </motion.div>
          }
        />
        <Route
          path="/auth/register"
          element={
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Authentication />
            </motion.div>
          }
        />
        <Route
          path="/home/:userId"
          element={
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Home />
            </motion.div>
          }
        />
        <Route
          path="/home/:userId/unit/:unitId/lesson/:lessonId"
          element={
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              <LessonLoader />
            </motion.div>
          }
        />
        <Route
          path="/home/:userId/unit/:unitId/lesson/:lessonId/task/:taskId"
          element={
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              <TaskLayout />
            </motion.div>
          }
        />
        <Route
          path="/home/:userId/complete"
          element={
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              <CompleteLessonScreen />
            </motion.div>
          }
        />
        <Route
          path="/home/:userId/settings"
          element={
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              <SettingsPage />
            </motion.div>
          }
        />
        <Route
          path="/terms"
          element={
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Terms />
            </motion.div>
          }
        />
        <Route
          path="/privacy"
          element={
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Privacy />
            </motion.div>
          }
        />
      </Routes>
    </AnimatePresence>
  );
}

export default App;
