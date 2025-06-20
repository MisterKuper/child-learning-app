import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "./Authentication.css";
import { assets } from "../../assets/assets";
import { db, auth, googleProvider } from "../../config/firebase";
import {
  doc,
  setDoc,
  getDoc,
  getDocs,
  collection,
  serverTimestamp,
} from "firebase/firestore";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";

function Authentication() {
  const location = useLocation();
  const isRegistering = location.pathname.includes("register");
  const [data, setData] = useState({ name: "", email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const onChangeHandler = (e) => {
    const { name, value } = e.target;
    setData((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    let formErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (isRegistering && !data.name) formErrors.name = "Imię jest wymagane";
    if (!data.email) formErrors.email = "E-mail jest wymagany";
    else if (!emailRegex.test(data.email))
      formErrors.email = "Niepoprawny e-mail";
    if (!data.password) formErrors.password = "Hasło jest wymagane";
    else if (isRegistering && data.password.length < 8)
      formErrors.password = "Hasło musi mieć co najmniej 8 znaków";

    setErrors(formErrors);
    return Object.keys(formErrors).length === 0;
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      let user;
      if (isRegistering) {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          data.email,
          data.password
        );
        user = userCredential.user;

        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);

        if (!userDoc.exists()) {
          await setDoc(userDocRef, {
            name: data.name,
            email: data.email,
            language: "pl",
            createdAt: serverTimestamp(),
          });

          await createUserProgress(user.uid);
        }
      } else {
        const userCredential = await signInWithEmailAndPassword(
          auth,
          data.email,
          data.password
        );
        user = userCredential.user;
      }

      navigate(`/home/${user.uid}`);
    } catch (err) {
      let errorMessage = "Wystąpił błąd. Spróbuj ponownie.";
      if (err.code === "auth/email-already-in-use") {
        errorMessage = "Użytkownik z tym adresem e-mail już istnieje.";
      } else if (err.code === "auth/invalid-email") {
        errorMessage = "Nieprawidłowy adres e-mail.";
      } else if (
        err.code === "auth/user-not-found" ||
        err.code === "auth/wrong-password"
      ) {
        errorMessage = "Nieprawidłowy e-mail lub hasło.";
      }
      setErrors({ general: errorMessage });
    }
  };

  const signInWithGoogle = async () => {
    setErrors({});
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (!userDoc.exists()) {
        const userName = user.displayName || "Użytkownik";
        await setDoc(doc(db, "users", user.uid), {
          name: userName,
          email: user.email,
          language: "pl",
          createdAt: serverTimestamp(),
        });

        await createUserProgress(user.uid);
      }

      navigate(`/home/${user.uid}`);
    } catch (err) {
      setErrors({ general: err.message });
    }
  };

  const createUserProgress = async (userId) => {
    const unitsSnap = await getDocs(collection(db, "units"));

    for (const unitDoc of unitsSnap.docs) {
      const unitId = unitDoc.id;
      const unitProgressRef = doc(db, "users", userId, "progress", unitId);

      await setDoc(unitProgressRef, {
        unitId,
        complete: false,
      });

      const lessonsSnap = await getDocs(
        collection(db, "units", unitId, "lessons")
      );
      for (const lessonDoc of lessonsSnap.docs) {
        const lessonId = lessonDoc.id;
        const lessonProgressRef = doc(
          unitProgressRef,
          "lessonsProgress",
          lessonId
        );

        await setDoc(lessonProgressRef, {
          lessonId,
          complete: false,
        });

        const tasksSnap = await getDocs(
          collection(db, "units", unitId, "lessons", lessonId, "tasks")
        );
        for (const taskDoc of tasksSnap.docs) {
          const taskId = taskDoc.id;
          const taskProgressRef = doc(
            lessonProgressRef,
            "tasksProgress",
            taskId
          );

          await setDoc(taskProgressRef, {
            taskId,
            complete: false,
          });
        }
      }
    }
  };

  return (
    <div className="form-container">
      <div className="close-icon">
        <Link to={"/"}>
          <img src={assets.cross_icon} alt="close" />
        </Link>
      </div>
      <div className="top-form-img">
        <img src={assets.laying_mascot} alt="top" />
      </div>
      <form onSubmit={handleAuth} className="auth-popup-container">
        <div className="auth-form">
          <h1>{isRegistering ? "Załóż konto" : "Logowanie"}</h1>
          <div className="auth-inputs">
            {isRegistering && (
              <>
                <input
                  name="name"
                  onChange={onChangeHandler}
                  value={data.name}
                  type="text"
                  placeholder="Imię"
                  className="input-field"
                />
                {errors.name && <p className="error-text">{errors.name}</p>}
              </>
            )}
            <input
              name="email"
              onChange={onChangeHandler}
              value={data.email}
              type="email"
              placeholder="E-mail"
              className="input-field"
            />
            {errors.email && <p className="error-text">{errors.email}</p>}

            {isRegistering && (
              <p className="password-hint">
                Hasło musi mieć co najmniej 8 znaków
              </p>
            )}
            <div className="password-wrapper">
              <input
                name="password"
                onChange={onChangeHandler}
                value={data.password}
                type={showPassword ? "text" : "password"}
                placeholder="Hasło"
                className="input-field password-input"
              />
              <img
                src={showPassword ? assets.eye_open_icon : assets.eye_hide_icon}
                alt="toggle password"
                className="eye-icon"
                onClick={() => setShowPassword((prev) => !prev)}
              />
            </div>

            {errors.password && <p className="error-text">{errors.password}</p>}
          </div>

          <button type="submit" className="submit-btn">
            {isRegistering ? "ZAŁÓŻ KONTO" : "ZALOGUJ SIĘ"}
          </button>

          <button
            type="button"
            onClick={signInWithGoogle}
            className="google-btn"
          >
            <img src={assets.google_icon} alt="google icon" />
            Zaloguj się przez Google
          </button>

          {errors.general && <p className="error-text">{errors.general}</p>}
        </div>

        <div className="line"></div>
        <p
          className="toggle-auth-text"
          onClick={() => {
            setErrors({});
            navigate(isRegistering ? "/auth/login" : "/auth/register");
          }}
        >
          {isRegistering
            ? "Masz już konto? Zaloguj się"
            : "Nie masz konta? Załóż konto"}
        </p>
        <div className="agreement-text">
          <p>
            Rejestrując się na TinkerTiko, akceptujesz nasze{" "}
            <span>
              <a href="/terms" target="_blank">
                warunki świadczenia usług
              </a>
            </span>{" "}
            i{" "}
            <span>
              <a href="/privacy" target="_blank">
                politykę prywatności
              </a>
            </span>
          </p>
        </div>
      </form>
        <div  className="bottom-form-img">
          <img src={assets.figures} alt="bottom" />
        </div>
    </div>
  );
}

export default Authentication;
