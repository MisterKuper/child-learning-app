import React, { useEffect, useState } from "react";
import "./SettingsPage.css";
import { auth, db } from "../../config/firebase";
import {
  doc,
  getDoc,
  updateDoc,
  getDocs,
  collection,
  deleteDoc,
} from "firebase/firestore";
import { deleteUser } from "firebase/auth";
import {
  updateEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from "firebase/auth";
import { assets } from "../../assets/assets";
import { useNavigate, useParams } from "react-router-dom";

function SettingsPage() {
  const navigate = useNavigate();
  const { userId } = useParams();

  const [userData, setUserData] = useState(null);
  const [languageMeta, setLanguageMeta] = useState({});
  const [selectedLang, setSelectedLang] = useState("pl");
  const [uiText, setUiText] = useState({});
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [errors, setErrors] = useState({
    name: "",
    email: "",
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
    general: "",
  });

  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userDoc = await getDoc(doc(db, "users", userId));
        const userData = userDoc.data();
        const user = auth.currentUser;

        if (!userData || !user) return;

        const lang = userData.language || "pl";
        const langDoc = await getDoc(doc(db, "languages", lang));
        const language = langDoc.exists() ? langDoc.data() : {};

        setUserData(userData);
        setName(userData.name || "");
        setEmail(user.email);
        setSelectedLang(lang);
        setUiText(language.ui_text || {});

        const languagesSnapshot = await getDocs(collection(db, "languages"));
        const metaData = {};
        languagesSnapshot.forEach((doc) => {
          const data = doc.data();
          metaData[doc.id] = data.meta || {};
        });
        setLanguageMeta(metaData);
      } catch (err) {
        console.error("Error:", err);
      }
    };
    fetchData();
  }, [userId]);

  const validateEmail = (email) => /^\S+@\S+\.\S+$/.test(email);

  const handleSave = async () => {
    setErrors({
      name: "",
      email: "",
      oldPassword: "",
      newPassword: "",
      confirmPassword: "",
      general: "",
    });

    const user = auth.currentUser;
    if (!user) return;

    if (!name.trim()) {
      setErrors((prev) => ({
        ...prev,
        name: uiText.error_name_required || "Name is required",
      }));
      return;
    }

    if (!email.trim() || !validateEmail(email)) {
      setErrors((prev) => ({
        ...prev,
        email: uiText.error_invalid_email || "Invalid email address",
      }));
      return;
    }

    if (oldPassword || newPassword || confirmPassword) {
      if (!oldPassword || !newPassword || !confirmPassword) {
        setErrors((prev) => ({
          ...prev,
          oldPassword: oldPassword
            ? ""
            : uiText.error_old_password_required || "Old password is required",
          newPassword: newPassword
            ? ""
            : uiText.error_new_password_required ||
              "New password is required",
          confirmPassword: confirmPassword
            ? ""
            : uiText.error_confirm_password_required ||
              "Please confirm your new password",
        }));
        return;
      }
      if (newPassword !== confirmPassword) {
        setErrors((prev) => ({
          ...prev,
          confirmPassword:
            uiText.error_passwords_not_match || "Passwords do not match",
        }));
        return;
      }
    }

    try {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        name,
        language: selectedLang,
      });

      if (email !== user.email) {
        await updateEmail(user, email);
      }

      if (oldPassword && newPassword) {
        const credential = EmailAuthProvider.credential(user.email, oldPassword);
        await reauthenticateWithCredential(user, credential);
        await updatePassword(user, newPassword);
      }

      const newLangDoc = await getDoc(doc(db, "languages", selectedLang));
      if (newLangDoc.exists()) {
        setUiText(newLangDoc.data().ui_text || {});
      }

      alert(uiText.saved || "Saved");

      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowOldPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
      setErrors({
        name: "",
        email: "",
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
        general: "",
      });
    } catch (error) {
      console.error("Error:", error);
      let errorMessage = uiText.error_general || "Error saving settings";

      if (error.code === "auth/wrong-password") {
        errorMessage = uiText.error_wrong_password || "Incorrect old password";
        setErrors((prev) => ({ ...prev, oldPassword: errorMessage }));
      } else if (error.code === "auth/email-already-in-use") {
        errorMessage =
          uiText.error_email_in_use || "This email is already in use";
        setErrors((prev) => ({ ...prev, email: errorMessage }));
      } else {
        setErrors((prev) => ({ ...prev, general: errorMessage }));
      }
    }
  };

  const handleGoHome = () => {
    navigate(`/home/${userId}`);
  };

  const deleteUserProgress = async (userId) => {
    const progressSnap = await getDocs(collection(db, "users", userId, "progress"));
    for (const unitDoc of progressSnap.docs) {
      const unitId = unitDoc.id;
      const lessonsSnap = await getDocs(collection(db, "users", userId, "progress", unitId, "lessonsProgress"));
      for (const lessonDoc of lessonsSnap.docs) {
        const lessonId = lessonDoc.id;
        const tasksSnap = await getDocs(collection(db, "users", userId, "progress", unitId, "lessonsProgress", lessonId, "tasksProgress"));
        for (const taskDoc of tasksSnap.docs) {
          await deleteDoc(taskDoc.ref);
        }
        await deleteDoc(lessonDoc.ref);
      }
      await deleteDoc(unitDoc.ref);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmText =
      uiText.confirm_delete_account ||
      "Are you sure you want to delete your account? This action is irreversible.";
    if (!window.confirm(confirmText)) return;

    try {
      const user = auth.currentUser;
      if (!user) return;

      const password = prompt(uiText.enter_password || "Enter your password to confirm:");
      if (!password) return;

      const credential = EmailAuthProvider.credential(user.email, password);
      await reauthenticateWithCredential(user, credential);

      // delete inner collections and docs
      await deleteUserProgress(user.uid);
      await deleteDoc(doc(db, "users", user.uid));
      await deleteDoc(doc(db, "userProgress", user.uid));

      await deleteUser(user);

      alert(uiText.account_deleted || "Account deleted successfully");
      navigate("/auth/register");
    } catch (error) {
      console.error("Error:", error);
      let msg =
        uiText.error_delete_account || "Failed to delete account. Please try again.";
      if (error.code === "auth/wrong-password") {
        msg = uiText.error_wrong_password || "Incorrect password. Account not deleted.";
      } else if (error.code === "auth/requires-recent-login") {
        msg =
          uiText.error_requires_recent_login ||
          "You need to log in again before you can delete your account.";
      }
      alert(msg);
    }
  };

  return (
    <div className="settings-container">
      <div className="close-icon">
        <img onClick={handleGoHome} src={assets.cross_icon} alt="close" />
      </div>

      <h1>{uiText.settings || "Settings"}</h1>

      <label>{uiText.name || "Name"}</label>
      <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
      {errors.name && <div className="error-message">{errors.name}</div>}

      <label>{uiText.email || "Email"}</label>
      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      {errors.email && <div className="error-message">{errors.email}</div>}

      <fieldset style={{ marginTop: "20px" }}>
        <legend>{uiText.change_password || "Change Password"}</legend>

        <label>{uiText.old_password || "Old Password"}</label>
        <div className="password-wrapper">
          <input
            type={showOldPassword ? "text" : "password"}
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            placeholder={uiText.old_password_placeholder || "Enter current password"}
          />
          <img
            src={showOldPassword ? assets.eye_open_icon : assets.eye_hide_icon}
            alt="toggle password"
            className="eye-icon"
            onClick={() => setShowOldPassword((prev) => !prev)}
          />
        </div>
        {errors.oldPassword && <div className="error-message">{errors.oldPassword}</div>}

        <label>{uiText.new_password || "New Password"}</label>
        <div className="password-wrapper">
          <input
            type={showNewPassword ? "text" : "password"}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder={uiText.new_password_placeholder || "Enter new password"}
          />
          <img
            src={showNewPassword ? assets.eye_open_icon : assets.eye_hide_icon}
            alt="toggle password"
            className="eye-icon"
            onClick={() => setShowNewPassword((prev) => !prev)}
          />
        </div>
        {errors.newPassword && <div className="error-message">{errors.newPassword}</div>}

        <label>{uiText.confirm_password || "Confirm New Password"}</label>
        <div className="password-wrapper">
          <input
            type={showConfirmPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder={uiText.confirm_password_placeholder || "Confirm new password"}
          />
          <img
            src={showConfirmPassword ? assets.eye_open_icon : assets.eye_hide_icon}
            alt="toggle password"
            className="eye-icon"
            onClick={() => setShowConfirmPassword((prev) => !prev)}
          />
        </div>
        {errors.confirmPassword && (
          <div className="error-message">{errors.confirmPassword}</div>
        )}
      </fieldset>

      {errors.general && <div className="error-message general-error">{errors.general}</div>}

      <label>{uiText.language || "Language"}</label>
      <div className="language-select">
        {Object.entries(languageMeta).map(([key, meta]) => (
          <div
            key={key}
            className={`language-option ${selectedLang === key ? "selected" : ""}`}
            onClick={() => setSelectedLang(key)}
          >
            <img src={meta.flag} alt={meta.name} />
            <span>{meta.name}</span>
          </div>
        ))}
      </div>

      <button className="save-button" onClick={handleSave}>
        {uiText.save || "Save"}
      </button>

      <div className="terms">
        <p>{uiText.terms_info || "You can read the terms and privacy policy of use below:"}</p>
        <a href="/terms" target="_blank" rel="noopener noreferrer">
          {uiText.terms_link || "Terms of Use"}
        </a>
        {" | "}
        <a href="/privacy" target="_blank" rel="noopener noreferrer">
          {uiText.privacy_link || "Privacy Policy"}
        </a>
      </div>

      <button className="delete-button" onClick={handleDeleteAccount}>
        {uiText.delete_account || "Delete Account"}
      </button>
    </div>
  );
}

export default SettingsPage;
