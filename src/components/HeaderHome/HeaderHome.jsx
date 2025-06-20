import React, { useEffect, useState } from "react";
import "./HeaderHome.css";
import { assets } from "../../assets/assets.js";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth, db } from "../../config/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

function HeaderHome({ visible }) {
  const [user, setUser] = useState(null);
  const [userName, setUserName] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [languageData, setLanguageData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);

        try {
          const userDocRef = doc(db, "users", currentUser.uid);
          const userDoc = await getDoc(userDocRef);

          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUserName(userData.name || "");

            const lang = userData.language || "pl";
            const langDoc = await getDoc(doc(db, "languages", lang));

            if (langDoc.exists()) {
              setLanguageData(langDoc.data());
            } else {
              console.warn("Language doc not found");
            }
          } else {
            console.warn("User doc not found");
          }
        } catch (err) {
          console.error("Error:", err);
        }
      } else {
        setUser(null);
        setUserName("");
      }
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = () => {
    signOut(auth)
      .then(() => {
        console.log("Logged out");
        setDropdownOpen(false);
        setUserName("");
        navigate("/auth/login");
      })
      .catch((error) => {
        console.error("Logout error:", error);
      });
  };

  const hello = languageData?.ui_text?.hello || "Hello";
  const logoutLabel = languageData?.ui_text?.logout || "Log out";
  const settingsLabel = languageData?.ui_text?.settings || "Settings";

  return (
    <div className={`welcome-header ${visible ? 'visible' : 'hidden'}`}>
      <div className="greating">
        <p>{hello},</p>
        <p>
          <span>{userName || "User"}</span>
        </p>
      </div>

      <p className="logo">TinkerTiko</p>

      <div className="user-menu">
        <img
          className="user-icon"
          src={assets.user_icon}
          alt="user icon"
          onClick={() => setDropdownOpen((prev) => !prev)}
          style={{ cursor: "pointer" }}
        />
        {dropdownOpen && (
          <div className="dropdown">
            <button
              onClick={() => user && navigate(`/home/${user.uid}/settings`)}
            >
              {settingsLabel}
            </button>
            <div className="separate-line"></div>
            <button className="log-out-btn" onClick={handleLogout}>
              {logoutLabel}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default HeaderHome;
