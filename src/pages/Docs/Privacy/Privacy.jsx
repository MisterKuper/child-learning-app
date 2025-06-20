import React from 'react';
import './Privacy.css';

function Privacy() {
  return (
    <div className="privacy-container">
      <h1>Polityka prywatności</h1>
      <p>
        Niniejsza polityka prywatności opisuje, jakie dane są gromadzone 
        podczas korzystania z aplikacji edukacyjnej, w jaki sposób są 
        przetwarzane oraz jakie środki bezpieczeństwa są stosowane w 
        celu ich ochrony.
      </p>

      <h2>1. Gromadzenie danych</h2>
      <p>
        Aplikacja może gromadzić następujące informacje:
        <ul>
          <li>Adres e-mail (w przypadku rejestracji)</li>
          <li>Ustawienia języka interfejsu i preferencje użytkownika</li>
          <li>Postępy w realizacji zadań edukacyjnych</li>
        </ul>
      </p>

      <h2>2. Wykorzystanie danych</h2>
      <p>
        Zebrane dane są wykorzystywane wyłącznie w celu zapewnienia 
        spersonalizowanego doświadczenia edukacyjnego, śledzenia 
        postępów użytkownika oraz ulepszania działania aplikacji.
      </p>

      <h2>3. Przechowywanie danych</h2>
      <p>
        Wszystkie dane są przechowywane w bezpiecznym środowisku 
        przy użyciu platformy Firebase. Dostęp do danych jest 
        ściśle ograniczony i chroniony.
      </p>

      <h2>4. Prawa użytkownika</h2>
      <p>
        Użytkownik ma prawo do:
        <ul>
          <li>Żądania usunięcia lub zmiany swoich danych</li>
          <li>Rezygnacji z korzystania z aplikacji w dowolnym momencie</li>
        </ul>
      </p>

      <h2>5. Bezpieczeństwo</h2>
      <p>
        Stosowane są nowoczesne metody ochrony danych, w tym 
        uwierzytelnianie za pomocą Firebase, szyfrowane połączenia 
        i kontrola dostępu.
      </p>
    </div>
  );
}

export default Privacy;
