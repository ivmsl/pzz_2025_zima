### USERS
- id (PK)
- username
- email
- password_hash

---

### EVENTS
- id (PK)
- name
- description
- creator_id (FK → USERS.id)
- time
- location
- time_poll_enabled (boolean)
- location_poll_enabled (boolean)
- created_at

---

### USERS_EVENTS (tablica M:N uczestników wydarzeń)
- user_id (FK → USERS.id)
- event_id (FK → EVENTS.id)

---

### INVITES
- id (PK)
- event_id (FK → EVENTS.id)
- sender_id (FK → USERS.id)      <!-- kto wysłał zaproszenie -->
- receiver_id (FK → USERS.id)    <!-- kto otrzymał zaproszenie -->
- status (enum: pending/accepted/declined)
- invite_code

---

### VOTES
- id (PK)
- event_id (FK → EVENTS.id)
- type (enum: time/location/general)
- question
- deadline

---

### VOTE_OPTIONS
- id (PK)
- vote_id (FK → VOTES.id)
- option_text

---

### USER_VOTES (tablica M:N odpowiedzi na głosowania)
- user_id (FK → USERS.id)
- vote_option_id (FK → VOTE_OPTIONS.id)

---

### NOTIFICATIONS
- id (PK)
- user_id (FK → USERS.id)
- type (enum: invite, vote, event, etc.)
- content
- read (boolean)
- created_at

---

### FRIENDS (opcjonalnie, relacja znajomych)
- user_id (FK → USERS.id)
- friend_id (FK → USERS.id)
- status (enum: requested/accepted/declined)

---

## Wyjaśnienie relacji

**1. USERS >-< EVENTS (poprzez USERS_EVENTS)**
- Użytkownik może być uczestnikiem dowolnej liczby wydarzeń, a wydarzenie może mieć dowolną liczbę uczestników.
- Relacja M:N jest realizowana przez tabelę pośredniczącą USERS_EVENTS.
- Dzięki temu łatwo sprawdzić do jakich wydarzeń należy użytkownik i ilu użytkowników uczestniczy w danym wydarzeniu.

**2. EVENTS -< VOTES**
- Jedno wydarzenie może mieć wiele głosowań (np. głosowanie na czas/miejsce/ogólne).
- Relacja 1:N pozwala przypisać do wydarzenia dowolną liczbę głosowań, a pojedyncze głosowanie zawsze należy do konkretnego wydarzenia.

**3. VOTES -< VOTE_OPTIONS**
- Każde głosowanie może mieć kilka wariantów do wyboru (np. terminy, miejsca).
- Relacja 1:N pozwala na dynamiczne dodawanie opcji odpowiedzi do każdego głosowania.

**4. USERS >-< VOTE_OPTIONS (poprzez USER_VOTES)**
- Użytkownik może zagłosować na wybrany wariant w głosowaniu.
- Pozwala to rejestrować, kto dokonał jakiego wyboru.
- Relacja M:N, ponieważ użytkownik może brać udział w wielu głosowaniach i każdy wariant może być wybrany przez wielu użytkowników.

**5. USERS <-> USERS (FRIENDS)**
- Opcjonalnie użytkownicy mogą być znajomymi w systemie.
- Relacja M:N pozwala dowolnemu użytkownikowi mieć wielu znajomych.
- Status znajomości pozwala zarządzać procesem zapraszania i akceptowania znajomości.

**6. USERS <-> INVITES**
- Zaproszenie łączy konkretnego nadawcę (sender_id), odbiorcę (receiver_id) oraz wydarzenie.
- Pozwala na zarządzanie flow zapraszania do wydarzenia, zarówno przez kliknięcie linku, jak i wybranie znajomych.
- Status pozwala obsłużyć odpowiedź na zaproszenie (przyjęte/odrzucone).

**7. USERS -< NOTIFICATIONS**
- Użytkownik może otrzymać dowolną liczbę powiadomień (np. o nowych zaproszeniach, zmianach w wydarzeniu, zakończeniu głosowania).
- Relacja 1:N jest typowa dla powiadomień, pozwala na czytelne zarządzanie listą notyfikacji dla każdego usera.

---

  **Dlaczego tak?**

    Projekt taki umożliwia:
    - Skalowalność (dowolna liczba użytkowników, wydarzeń, głosowań itp.)
    - Elastyczność (możliwość rozwoju, np. dodanie kolejnych typów głosowań czy powiadomień)
    - Wygodę w obsłudze flow: rejestracja, zaproszenia, potwierdzanie udziału, głosowania, notyfikacje.
    - Przechowuje tylko informacje niezbędne do realizacji funkcjonalności opisanych w projekcie, bez nadmiarowych danych.

Relacje są zgodne z praktyką projektowania relacyjnych baz danych dla aplikacji społecznościowych i eventowych, ułatwiają implementację opisanych ścieżek użytkownika i gwarantują spójność danych.
