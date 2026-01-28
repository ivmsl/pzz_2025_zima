# Dokumentacja API głosowań

Ten dokument opisuje kompletny system API głosowań używany w aplikacji MeatEase. Obejmuje struktury danych głosów, funkcje oraz sposób przetwarzania i wyświetlania wyników głosowań.

---

## Spis treści

1. [Struktury głosów](#struktury-głosów)
2. [Funkcje głosowań](#funkcje-głosowań)
3. [Wyniki głosowań i wyświetlanie](#wyniki-głosowań-i-wyświetlanie)

---

## Struktury głosów

### Deskryptor głosu

**Deskryptor głosu** to podstawowy obiekt metadanych definiujący głosowanie. Zawiera wszystkie informacje o tym, na co się głosuje.

**Struktura:**
```javascript
{
  id: string,                    // Unikalny identyfikator głosu (UUID)
  event_id: string,              // ID wydarzenia, do którego należy głos
  type: string,                  // Typ głosu: "time" | "location" | "general"
  question: string,              // Pytanie/polecenie głosu (np. "Gdzie idziemy na kolację?")
  deadline: string,              // Termin w formacie YYYY-MM-DD
  deadlineTime: string           // Godzina terminu w formacie HH:MM
}
```

**Uwagi:**
- Pola `deadline` i `deadlineTime` są przechowywane osobno w interfejsie, ale łączone w jeden znacznik czasu ISO przy zapisie do bazy danych
- Pole `type` określa strukturę opcji:
  - `"time"`: Używa opcji czasowych (data + zakresy godzin)
  - `"location"`: Używa opcji tekstowych (nazwy miejsc)
  - `"general"`: Używa opcji tekstowych (dowolne pytanie głosowania)

---

### Opcje

**Opcje** to wybory dostępne w głosowaniu. Struktura zależy od typu głosu.

#### Opcje tekstowe (dla głosów „general” i „location”)

Prosta tablica ciągów reprezentujących wybory:

```javascript
options: string[]
// Przykład: ["Restauracja A", "Restauracja B", "Restauracja C"]
```

**Przechowywanie:**
- Każda opcja jest zapisywana w tabeli `vote_options` w polu `option_text`
- Opcje to zwykłe ciągi tekstowe

#### Opcje czasowe (dla głosów „time”)

Tablica obiektów reprezentujących daty i zakresy godzin:

```javascript
timedOption: Array<{
  date: string,      // Data w formacie YYYY-MM-DD
  start: string,    // Godzina rozpoczęcia w formacie HH:MM
  end: string       // Godzina zakończenia w formacie HH:MM
}>
```

**Przykład:**
```javascript
timedOption: [
  { date: "2025-06-15", start: "18:00", end: "20:00" },
  { date: "2025-06-16", start: "19:00", end: "21:00" }
]
```

**Przechowywanie:**
- Opcje czasowe są zapisywane jako jeden ciąg w formacie: `"YYYY-MM-DD|HH:MM|HH:MM"`
- Przykład: `"2025-06-15|18:00|20:00"`
- Znak potoku (`|`) służy jako separator
- Przy odczycie z bazy są parsowane z powrotem do formatu obiektu za pomocą wyrażenia regularnego: `/^\d{4}-\d{2}-\d{2}\|\d{2}:\d{2}\|\d{2}:\d{2}$/`

---

### Pełna struktura obiektu głosu

Przy tworzeniu lub edycji głosu pełna struktura wygląda następująco:

```javascript
{
  voteDescriptor: {
    id: string,
    event_id: string,
    type: "time" | "location" | "general",
    question: string,
    deadline: string,        // YYYY-MM-DD
    deadlineTime: string     // HH:MM
  },
  options: string[],         // Dla typów "general" i "location"
  timedOption: Array<{      // Dla typu "time"
    date: string,
    start: string,
    end: string
  }>
}
```

**Ważne:**
- Dla głosów `"time"`: używaj `timedOption`, `options` powinno być puste
- Dla głosów `"location"` i `"general"`: używaj `options`, `timedOption` powinno być puste
- Do poprawnego głosu wymagane są co najmniej 2 opcje / opcje czasowe

---

## Funkcje głosowań

Wszystkie funkcje głosowań znajdują się w pliku `meetease/src/lib/voteService.js` i są funkcjami serwerowymi (oznaczonymi `"use server"`).

### `registerVote(voteData, eventId)`

Rejestruje obiekty głosów podczas tworzenia wydarzenia.

**Parametry:**
- `voteData` (Object): Obiekt danych głosu o strukturze:
  ```javascript
  {
    time: VoteObject | null,           // Opcjonalny głos czasowy
    location: VoteObject | null,        // Opcjonalny głos lokalizacyjny
    general: VoteObject[] | null        // Opcjonalna tablica głosów ogólnych
  }
  ```
- `eventId` (string): ID wydarzenia, z którym powiązać głosy

**Zwraca:**
- `Promise<void>` — rozwiązuje się przy sukcesie, rzuca błąd przy niepowodzeniu

**Użycie:**
```javascript
await registerVote({
  time: {
    voteDescriptor: { /* ... */ },
    timedOption: [ /* ... */ ],
    options: []
  },
  location: {
    voteDescriptor: { /* ... */ },
    options: [ /* ... */ ],
    timedOption: []
  },
  general: [
    {
      voteDescriptor: { /* ... */ },
      options: [ /* ... */ ],
      timedOption: []
    }
  ]
}, eventId)
```

**Proces wewnętrzny:**
1. Tworzy rekordy głosów w tabeli `votes`
2. Konwertuje datę i godzinę terminu na znacznik czasu ISO za pomocą `dayTimeToTimestampTZ()`
3. Dla opcji czasowych: konwertuje do formatu ciągu z separatorem potoku (`YYYY-MM-DD|HH:MM|HH:MM`)
4. Wstawia opcje do tabeli `vote_options`

---

### `fetchEventVotes(eventId)`

Pobiera wszystkie głosy dla danego wydarzenia, pogrupowane według typu.

**Parametry:**
- `eventId` (string): ID wydarzenia

**Zwraca:**
- `Promise<Object>` — obiekt z głosami pogrupowanymi według typu:
  ```javascript
  {
    time: Array<VoteObject>,      // Tablica głosów czasowych
    location: Array<VoteObject>,   // Tablica głosów lokalizacyjnych
    general: Array<VoteObject>     // Tablica głosów ogólnych
  }
  ```

**Struktura VoteObject (zwracana):**
```javascript
{
  voteDescriptor: {
    id: string,
    event_id: string,
    type: string,
    question: string,
    deadline: string,        // Konwertowane z powrotem ze znacznika czasu na YYYY-MM-DD
    deadlineTime: string      // Konwertowane z powrotem ze znacznika czasu na HH:MM
  },
  timedOptions: Array<{      // Parsowane z ciągów z separatorem potoku
    date: string,
    start: string,
    end: string
  }>,
  options: string[]          // Opcje tekstowe
}
```

**Proces wewnętrzny:**
1. Pobiera wszystkie deskryptory głosów dla wydarzenia
2. Konwertuje znacznik czasu terminu z powrotem na datę i godzinę za pomocą `timestampTZToDayTime()`
3. Pobiera opcje dla każdego głosu
4. Dla głosów czasowych: parsuje ciągi z separatorem potoku z powrotem do obiektów
5. Grupuje głosy według typu

---

### `castAVote(voteId, optionId, userId)`

Oddaje głos na wybraną opcję.

**Parametry:**
- `voteId` (string): ID głosu
- `optionId` (string): ID opcji, na którą głosowano
- `userId` (string): ID użytkownika oddającego głos

**Zwraca:**
- `Promise<Object>` — utworzony rekord głosu użytkownika:
  ```javascript
  {
    user_id: string,
    vote_option_id: string,
    // ... inne pola
  }
  ```

**Walidacja:**
- Sprawdza, czy użytkownik może głosować (musi być twórcą wydarzenia lub uczestnikiem)
- Rzuca błąd, jeśli użytkownik nie może głosować

**Uwaga:** Ta funkcja nie zapobiega wielokrotnemu głosowaniu. Logika oddawania głosu w `serverActions.js` (`handleCastGeneralVote`) usuwa poprzednie głosy przed wstawieniem nowego.

---

### `fetchVoteResultsEventUser(eventId, userId)`

Pobiera wyniki głosowań dla wydarzenia wraz z głosami danego użytkownika.

**Parametry:**
- `eventId` (string): ID wydarzenia
- `userId` (string): ID użytkownika

**Zwraca:**
- `Promise<Array>` — tablica obiektów głosów z wynikami:
  ```javascript
  [
    {
      voteDescriptor: {
        id: string,
        event_id: string,
        type: string,
        question: string,
        deadline: string,
        deadlineTime: string
      },
      results: [
        {
          option_id: string,
          option_text: string,
          total_votes: number
        },
        // ... więcej wyników
      ],
      userVote: string | null  // ID opcji, na którą głosował użytkownik, lub null
    },
    // ... więcej głosów
  ]
  ```

**Proces wewnętrzny:**
1. Pobiera wszystkie deskryptory głosów dla wydarzenia
2. Pobiera wyniki głosowań zbiorczo (z widoku/tabeli `vote_results`)
3. Dla każdego głosu sprawdza, czy użytkownik oddał głos
4. Zwraca połączoną strukturę z wynikami i głosem użytkownika

**Użycie w komponentach:**
To główna funkcja używana przez komponent `EventVotings` do wyświetlania głosów z wynikami.

---

### `getUserVoteByVoteID(userId, voteId)`

Pobiera głos użytkownika dla danego głosu.

**Parametry:**
- `userId` (string): ID użytkownika
- `voteId` (string): ID głosu

**Zwraca:**
- `Promise<Object | null>` — informacje o głosie użytkownika:
  ```javascript
  {
    id: string,           // ID opcji, na którą głosował użytkownik
    voteId: string,       // ID głosu
    user: string          // ID użytkownika
  }
  ```
  Lub `null`, jeśli użytkownik nie oddał głosu

---

### `fetchVoteVotes(voteId)`

Pobiera wyniki głosowania dla danego głosu.

**Parametry:**
- `voteId` (string): ID głosu

**Zwraca:**
- `Promise<Array>` — tablica obiektów wyników głosowania:
  ```javascript
  [
    {
      vote_id: string,
      option_id: string,
      option_text: string,
      total_votes: number,
      question: string,      // Z deskryptora głosu
      // ... inne pola
    },
    // ... więcej wyników
  ]
  ```

**Uwaga:** Ta funkcja odpytywuje tabelę/widok `vote_results`, który zawiera zagregowane liczby głosów.

---

### `fetchVotedVotesForEvent(eventId)`

Pobiera wszystkie głosy wydarzenia, które mają wyniki (tj. na które oddano głosy).

**Parametry:**
- `eventId` (string): ID wydarzenia

**Zwraca:**
- `Promise<Array>` — tablica głosów z wynikami:
  ```javascript
  [
    {
      id: string,              // ID głosu
      question: string,         // Pytanie głosu
      results: Array<{         // Wyniki głosu
        option_id: string,
        option_text: string,
        total_votes: number,
        // ... inne pola
      }>
    },
    // ... więcej głosów
  ]
  ```

---

## Wyniki głosowań i wyświetlanie

### Struktura wyników głosowania

Wyniki głosowań są pobierane z widoku/tabeli bazy danych `vote_results` i mają następującą strukturę:

```javascript
{
  option_id: string,        // ID opcji głosu
  option_text: string,      // Tekst opcji (lub ciąg z separatorem potoku dla głosów czasowych)
  total_votes: number       // Liczba głosów oddanych na tę opcję
}
```

**Dla głosów czasowych:**
- `option_text` zawiera format z separatorem potoku: `"YYYY-MM-DD|HH:MM|HH:MM"`
- Musi być sparsowany do wyświetlenia

---

### Komponent EventVotings

**Lokalizacja:** `meetease/src/components/events/event-votings.jsx`

**Props:**
```javascript
{
  user: Object,                    // Obiekt bieżącego użytkownika
  event: Object,                   // Obiekt wydarzenia
  fetchEventVotes: Function,       // Funkcja pobierająca głosy (wywołuje handleFetchVoteResultsEventUser)
  castVote: Function,              // Funkcja oddawania głosu
  closeVote: Function,             // Funkcja zamykania głosu (tylko twórca)
  deleteVote: Function             // Funkcja usuwania głosu (tylko twórca)
}
```

**Oczekiwana struktura danych:**

Komponent oczekuje, że `fetchEventVotes` zwróci:
```javascript
{
  success: boolean,
  voteResults: [
    {
      voteDescriptor: {
        id: string,
        event_id: string,
        type: "time" | "location" | "general",
        question: string,
        deadline: string,        // YYYY-MM-DD
        deadlineTime: string     // HH:MM
      },
      results: [
        {
          option_id: string,
          option_text: string,
          total_votes: number
        }
      ],
      userVote: string | null    // ID opcji, na którą głosował użytkownik, lub null
    }
  ],
  error: string | null
}
```

**Działanie:**

1. **Ładowanie:** Przy montowaniu wywołuje `fetchEventVotes(event.id, user.id)`
2. **Wyświetlanie:** Iteruje po tablicy `voteResults` i renderuje `VoteResultBlock` dla każdego głosu
3. **Głosowanie:** Po kliknięciu opcji przez użytkownika wywołuje `castVote(voteId, optionId, user.id)`
4. **Odświeżanie:** Po oddaniu głosu ponownie ładuje głosy, aby pokazać zaktualizowane wyniki

---

### Komponent VoteResultBlock

**Lokalizacja:** `meetease/src/components/votes/results/voteResultBlock.jsx`

**Props:**
```javascript
{
  voteDescriptor: {
    id: string,
    type: string,
    question: string,
    deadline: string,
    deadlineTime: string
  },
  results: [
    {
      option_id: string,
      option_text: string,
      total_votes: number
    }
  ],
  userVote: string | null,      // ID opcji, na którą głosował użytkownik
  onCastVote: Function          // Callback: (voteId, optionId) => Promise<void>
}
```

**Działanie:**

1. **Wyświetlanie:** Pokazuje pytanie głosu, opis typu i termin
2. **Opcje:** Iteruje po tablicy `results`, aby wyświetlić każdą opcję
3. **Głosowanie:**
   - Gdy `userVote` jest `null`: opcje są przyciskami do kliknięcia
   - Gdy `userVote` jest ustawione: opcje są wyłączone i pokazują paski procentowe
4. **Obliczanie procentów:**
   ```javascript
   const calculatePercentage = (optionId) => {
     const totalVotes = results.reduce((acc, opt) => acc + opt.total_votes, 0)
     const optionVotes = results.find(opt => opt.option_id === optionId)?.total_votes || 0
     return (optionVotes / totalVotes) * 100
   }
   ```
5. **Informacja zwrotna wizualna:**
   - Przed głosowaniem: zwykłe przyciski
   - Po głosowaniu: przyciski z gradientowym tłem proporcjonalnym do procentu głosów
   - Procent wyświetlany jako nakładka tekstowa

**Formatowanie głosów czasowych:**

Dla głosów czasowych `option_text` ma format `"YYYY-MM-DD|HH:MM|HH:MM"`. Komponent powinien formatować to do wyświetlenia, choć obecna implementacja pokazuje wartość bez zmian. Funkcja pomocnicza `formatTimeOption` istnieje w `event-votings.jsx`, ale nie jest obecnie używana w `VoteResultBlock`.

**Przykład wyświetlania:**
- Przed głosowaniem: Klikalny przycisk z tekstem opcji
- Po głosowaniu: Wyłączony przycisk z:
  - Gradientowym tłem pokazującym procent (np. 60% niebieski, 40% przezroczysty)
  - Tekstem opcji
  - Etykietą procentu (np. „60%”)

---

## Przykład przepływu danych

### Tworzenie głosu

1. Użytkownik wypełnia komponent `GeneralVote` w kreatorze wydarzenia
2. Komponent zwraca obiekt głosu przez `returnVoteDescriptor()`:
   ```javascript
   {
     voteDescriptor: { /* ... */ },
     options: ["Opcja 1", "Opcja 2"],
     timedOption: []
   }
   ```
3. Kreator wydarzenia zbiera wszystkie głosy do `voteObjects`:
   ```javascript
   {
     time: VoteObject | null,
     location: VoteObject | null,
     general: [VoteObject, ...]
   }
   ```
4. Wywoływane jest `registerVote(voteObjects, eventId)`
5. Głosy są zapisywane do bazy danych

### Wyświetlanie głosów

1. Komponent `EventVotings` wywołuje `fetchEventVotes(event.id, user.id)`
2. Akcja serwera `handleFetchVoteResultsEventUser` wywołuje `fetchVoteResultsEventUser(eventId, userId)`
3. Funkcja zwraca tablicę głosów z wynikami i głosami użytkownika
4. Komponent iteruje po głosach i renderuje `VoteResultBlock` dla każdego
5. Każdy `VoteResultBlock` wyświetla opcje i umożliwia głosowanie (jeśli użytkownik jeszcze nie głosował)

### Oddawanie głosu

1. Użytkownik klika opcję w `VoteResultBlock`
2. Wywoływane jest `onCastVote(voteId, optionId)`
3. Wywoływana jest akcja serwera `handleCastGeneralVote` lub `handleCastAVote`
4. Poprzedni głos użytkownika jest usuwany (jeśli istnieje)
5. Wstawiany jest nowy głos
6. Komponent ponownie ładuje głosy, aby pokazać zaktualizowane wyniki

---

## Ważne uwagi

1. **Typy głosów:**
   - `"time"`: Używa tablicy `timedOption`, zapisywanej jako ciągi z separatorem potoku
   - `"location"`: Używa tablicy `options`, zwykły tekst
   - `"general"`: Używa tablicy `options`, zwykły tekst

2. **Obsługa terminu:**
   - Przechowywany jako osobna data i godzina w interfejsie
   - Łączony w znacznik czasu ISO w bazie danych
   - Konwertowany z powrotem na datę i godzinę przy pobieraniu

3. **Walidacja głosów:**
   - Użytkownicy mogą głosować tylko jako twórca wydarzenia lub uczestnik
   - Głosy można zamknąć przez ustawienie terminu na aktualny czas
   - Po upływie terminu głosowanie jest wyłączone

4. **Agregacja wyników:**
   - Wyniki pochodzą z widoku/tabeli `vote_results` (zagregowane)
   - Każdy wynik zawiera `option_id`, `option_text` i `total_votes`
   - Procenty są obliczane po stronie klienta

5. **Śledzenie głosu użytkownika:**
   - Pole `userVote` zawiera ID opcji, na którą głosował użytkownik
   - Jeśli `null`, użytkownik jeszcze nie głosował
   - Używane do wyłączenia głosowania i pokazania wyników

---

## Schemat bazy danych (odniesienie)

**Tabela votes:**
- `id` (UUID, klucz główny)
- `event_id` (UUID, klucz obcy)
- `type` (tekst: "time" | "location" | "general")
- `question` (tekst)
- `deadline` (znacznik czasu ze strefą czasową)

**Tabela vote_options:**
- `id` (UUID, klucz główny)
- `vote_id` (UUID, klucz obcy)
- `option_text` (tekst)

**Tabela user_votes:**
- `user_id` (UUID, klucz obcy)
- `vote_option_id` (UUID, klucz obcy)

**Widok/tabela vote_results:**
- Widok zagregowany pokazujący liczby głosów na opcję
- Zawiera: `vote_id`, `option_id`, `option_text`, `total_votes`, `question`

---

## Podsumowanie

API głosowań zapewnia kompletny system głosowania z:
- **Trzema typami głosów:** czasowy, lokalizacyjny i ogólny
- **Elastycznymi opcjami:** opcje tekstowe dla głosów ogólnych/lokalizacyjnych, opcje czasowe dla głosów czasowych
- **Śledzeniem wyników:** zagregowane liczby głosów z obliczaniem procentów
- **Głosowaniem użytkowników:** jeden głos na użytkownika na głos (można zmienić)
- **Obsługą terminu:** głosy można zamknąć w określonej dacie i godzinie
- **Głosowaniem anonimowym:** wyniki pokazują procenty, nie pojedyncze głosy

Ta dokumentacja powinna dostarczyć wystarczających informacji, aby każdy programista mógł zrozumieć i pracować z systemem głosowań.
