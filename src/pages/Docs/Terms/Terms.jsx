import React from 'react';
import './Terms.css';

function Terms() {
  return (
    <div className="terms-container">
      <h1>Regulamin korzystania</h1>
      <p>
        Niniejszy regulamin określa zasady korzystania z aplikacji 
        edukacyjnej, prawa i obowiązki użytkowników oraz zasady 
        odpowiedzialności.
      </p>
      <p>
        Korzystanie z aplikacji oznacza akceptację poniższych warunków.
      </p>

      <h2>1. Cel aplikacji</h2>
      <p>
        Aplikacja służy do wspierania rozwoju dzieci w wieku 
        przedszkolnym poprzez interaktywne zadania edukacyjne.
      </p>

      <h2>2. Warunki korzystania</h2>
      <p>
        Użytkownik zobowiązuje się do korzystania z aplikacji w 
        sposób zgodny z jej przeznaczeniem, niezakłócający działania 
        systemu ani nie naruszający praw innych użytkowników.
      </p>

      <h2>3. Ograniczenia</h2>
      <p>
        Zabronione jest kopiowanie, modyfikowanie, rozpowszechnianie 
        lub wykorzystywanie aplikacji w celach komercyjnych bez zgody 
        autora.
      </p>

      <h2>4. Odpowiedzialność</h2>
      <p>
        Twórcy aplikacji nie ponoszą odpowiedzialności za szkody 
        wynikłe z nieprawidłowego korzystania z aplikacji lub 
        przerw w jej dostępności.
      </p>

      <h2>5. Zmiany w regulaminie</h2>
      <p>
        Regulamin może być okresowo aktualizowany.
      </p>
    </div>
  );
}

export default Terms;
