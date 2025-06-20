import React, { useEffect } from "react";
import './Welcome.css'
import { Link } from "react-router-dom";
import { assets } from "../../assets/assets";
import { motion, useAnimation } from "framer-motion";
import { useInView } from "react-intersection-observer";

const Welcome = () => {
  const controls = useAnimation();
  const [ref, inView] = useInView({ threshold: 0.6 });

  useEffect(() => {
    if (inView) {
      controls.start("visible");
    } else {
      controls.start("hidden");
    }
  }, [inView, controls]);

  const mascotVariants = {
    hidden: { y: 200 },
    visible: {
      y: 0,
      transition: {
        type: "spring",
        stiffness: 200,
        damping: 25,
      },
    },
  };

  return (
    <div className="welcome-page">
      {/* Header */}
      <div className="header">
        <div className="top-section">
          <Link to="/" className="logo">TinkerTiko</Link>
        </div>

        <div className="bottom-section">
          <div className="image-frame">
            <motion.img
              className="header-image-front"
              src={assets.spiral_mascot}
              alt="header image"
              animate={{ y: [0, -30, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
            />

            <motion.img
              className="header-image-middle"
              src={assets.spiral_stuff}
              alt="far background"
              animate={{ rotate: 360 }}
              transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
            />

            <motion.img
              className="header-image-back"
              src={assets.spiral}
              alt="near background"
              animate={{ rotate: 360 }}
              transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
            />
          </div>

          <div className="buttons-column">
            <Link to="/auth/register">
              <button className="register-button">ZAŁÓŻ KONTO</button>
            </Link>
            <Link to="/auth/login">
              <button className="login-button">MAM JUŻ KONTO</button>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="login-main">
        <div className="introdaction-block">
          <h1>Witamy w <span>TinkerTiko</span>!</h1>
          <p className="login-main-description">
            <span>TinkerTiko</span> to zabawna i przydatna aplikacja 
            rozwijająca logiczne myślenie i pamięć u przedszkolaków!
          </p>
        </div>

        {/* part 1/3 */}
        <div className="top-list">
          <ul className="login-main-benefits">
            <li>🚀 Rozwijaj uwagę i koncentrację.</li>
            <li>🧠 Popraw pamięć.</li>
            <li>🧩 Rozwijaj logikę i umiejętności rozwiązywania problemów.</li>
            <li>🎉 Ucz się nowych rzeczy w zabawny sposób!</li>
          </ul>

          <div className="image-frame-right">
            <img className="header-image-front-right" src={assets.reading_mascot} alt="header" />

            <motion.img
              className="header-image-middle-right"
              src={assets.reading_thoghts}
              alt="near background"
              animate={{ y: [0, -15, 0] }}
              transition={{ duration: 5, repeat: Infinity }}
            />

            <motion.img
              className="header-image-back-right"
              src={assets.reading_bubbles}
              alt="far background"
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 5, repeat: Infinity }}
            />
          </div>
        </div>

        {/* part 2/3 */}
        <h2 className="login-main-subtitle">Na jakie gry możecie się doczekać?</h2>
        <div className="bottom-list">
          <div className="image-frame-left">

            <motion.img
              className="header-image-front-left"
              src={assets.cards_front}
              alt="near background"
              animate={{ y: [0, -15, 0] }}
              transition={{ duration: 5, repeat: Infinity }}
            />

            <motion.img
              className="header-image-middle-left"
              src={assets.flying_mascot}
              alt="far background"
              animate={{ y: [0, 20, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
            />
            
            <motion.img
              className="header-image-back-left"
              src={assets.cards_back}
              alt="far background"
              animate={{ y: [0, 15, 0] }}
              transition={{ duration: 5, repeat: Infinity }}
            />
          </div>

          <ul className="login-main-games">
            <li>💡 Znalezienie właściwej odpowiedzi</li>
            <li>🔗 Dopasowywanie par</li>
            <li>🎴 Wyszukiwanie par</li>
            <li>🖼️ Puzzle</li>
          </ul>
        </div>

        {/* part 3/3 */}
<div className="call-to-action-block">
  <h2 className="login-main-call-to-action">
    Dołącz do nas i zacznij rozwijać ważne umiejętności już dziś!
  </h2>

  <Link to="/auth/register">
    <button className="register-button">ZAŁÓŻ KONTO</button>
  </Link>

  <div className="animated-container" ref={ref}>
    <div className="bubbles-row back">
      {[...Array(5)].map((_, i) => (
        <motion.img
          key={i}
          src={assets.bubbles_back}
          alt={`bg1-${i}`}
          className="bubbles-bg"
          animate={{ y: [0, -15, 0] }}
          transition={{ duration: 5, repeat: Infinity }}
        />
      ))}
    </div>


    <div className="bubbles-row front">
      {[...Array(5)].map((_, i) => (
        <motion.img
          key={i}
          src={assets.bubbles_front}
          alt={`bg2-${i}`}
          className="bubbles-bg"
          animate={{ y: [0, 15, 0] }}
          transition={{ duration: 5, repeat: Infinity }}
        />
      ))}
    </div>
    <motion.div
      className="mascot-container"
      variants={mascotVariants}
      initial="hidden"
      animate={controls}
    >
      <img src={assets.jump_mascot} alt="Mascot" className="mascot-image" />
    </motion.div>
  </div>
</div>

      </div>

      {/* Footer */}
      <div className="footer">
        <div className="container">
          <div className="left-section">
            <p className="text">© 2025, Praca inżynierska na temat aplikacji edukacyjnej.</p>
            <p className="text autor">Autor: Roman Kolishenko, Akademia Finansów i Biznesu Vistula, 2025 rok.</p>
          </div>

          <div className="right-section">
            <Link to="/privacy" target="_blank" className='link'>Polityka prywatności</Link>
            <Link to="/terms" target="_blank" className='link'>Warunki użytkowania</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Welcome;
