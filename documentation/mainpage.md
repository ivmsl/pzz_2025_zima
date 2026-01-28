# MeetEase — Dokumentacja

**MeetEase** to webowa aplikacja, która ułatwia planowanie wspólnych spotkań, projektów i wydarzeń.

---

## O projekcie

**MeetEase** — to planer wydarzeń z funkcją socjalnej interakcji.

Dzięki projektu organizowanie terminów, ustalanie miejsca i potwierdzanie
obecności staje się szybkie i bezproblemowe — bez długich rozmów i
niekończących się wiadomości.

Celem **MeetEase** jest uproszczenie procesu umawiania spotkań grupowych.

Zamiast wymieniać dziesiątki wiadomości, użytkownicy mogą w kilka kliknięć:

* stworzyć wydarzenie,
* zaprosić innych przez link lub kod,
* zagłosować na termin i miejsce,
* zobaczyć wyniki i potwierdzić swoją obecność.

---

## Założenia projektowe

Główne założenia funkcjonalne:

| Obszar                    | Opis                                                                                                                                                   |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Strony**          | Strona domowa (bez/z auth), lista wydarzeń, tworzenie wydarzenia, dołączanie przez kod, strona wydarzenia, ustawienia.                              |
| **Elementy**        | Lista wydarzeń (nazwa, twórca, lokalizacja, data), menu ustawień, okno dołączenia (kod), lista uczestników, powiadomienia, znajomi, głosowania. |
| **Flow wydarzenia** | Tworzenie → zapis w bazie → udostępnienie kodu/linku → zaproszenie znajomych → potwierdzenie/odrzucenie → lista uczestników.                    |
| **Wydarzenie**      | Nazwa i opis — obowiązkowe. Czas i miejsce — obowiązkowe lub do głosowania (przynajmniej dwa warianty).                                           |
| **Głosowania**     | Min. dwa warianty, deadline, po deadline stan „zakończone”; zakończonych nie edytuje się.                                                         |

Szczegóły: [Załoenia_projektowe.md](Załoenia_projektowe.md).

---

## Architektura i technologie

- **Frontend:** Next.js (App Router), React, komponenty UI (m.in. shadcn/ui).
- **Backend / Baza:** Supabase (baza PostgreSQL, auth, API).
- **Dokumentacja kodu:** Doxygen (JavaScript/React).

Moduły kodu obejmują m.in.:

- **Serwisy:** `eventService`, `voteService`, `userService` — logika wydarzeń, głosowań i użytkowników.
- **Akcje serwera:** Next.js Server Actions (tworzenie/aktualizacja wydarzeń, głosy, zaproszenia).
- **Komponenty:** wydarzenia, głosowania, modale, formularze, wyniki głosowań.

---

## Informacja o wewnętrznej strukturze:

* Wszystkie funkcje serwerowe (Node.js) są zdefiniowane w folderze lib
* Głównym łącznikiem funkcji serwerowych a frontendu jest serverActions.js, który definiuje ścisły zbiór funkcji, dostępnych dla frontenda
* defaults.js oraz utils.js były niezbędne dla początkowej konfiguracji projektu
* Folder utils zawiera rzeczy związane z supabase
* Poszczególny komponenty React umieszczone w folderze components

*Dokumentacja wygenerowana przez Doxygen. Strona główna w języku polskim.*
