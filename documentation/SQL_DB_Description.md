# Baza danych: opis tabeli i funkcji

Liczba tabel znalezionych w schemacie public: 11

*Uwaga: dokument został wygenerowany poprzez AI dostępny w Supabase.*

---

## profiles

* RLS: tak
* Kolumny:
  * id — uuid, domyślnie  `auth.uid()`, klucz główny
  * username — text, unikalne
  * email — text, unikalne
  * created_at — timestamptz, domyślnie  `now()`
* Klucz główny: id
* Ograniczenia kluczy obcych:
  * `profiles.id` → `auth.users.id` (constraint: profiles_id_fkey)
* Uwagi:
  * Typowe użycie jako rozszerzenie użytkownika z Auth. RLS włączone — zapewne polityki ograniczające dostęp do własnego profilu.

---

## events

* RLS: tak
* Kolumny:
  * id — uuid, domyślnie `gen_random_uuid()`, klucz główny
  * name — text
  * description — text, nullable
  * creator_id — uuid (odwołuje się do auth.users)
  * time_start — time, nullable
  * location — text, nullable
  * time_poll_enabled — boolean, domyślnie false
  * location_poll_enabled — boolean, domyślnie false
  * created_at — timestamptz, domyślnie now()
  * time_end — time, nullable
  * date — date, nullable
* Klucz główny: id
* Ograniczenia kluczy obcych:
  * `events.creator_id` → `auth.users.id` (events_creator_id_fkey)
  * powiązania z innymi tabelami: invites.event_id, users_events.event_id, event_codes.event_id, votes.event_id
* Uwagi:
  * Reprezentuje wydarzenia tworzone przez użytkowników.

---

## users_events

* RLS: tak
* Kolumny:
  * user_id — uuid
  * event_id — uuid
  * joined_at — timestamptz, domyślnie now()
* Klucz główny: (user_id, event_id) — klucz złożony
* Ograniczenia kluczy obcych:
  * `users_events.user_id` →`auth.users.id`
  * `users_events.event_id` →`public.events.id`
* Uwagi:
  * Tabela łącząca wielu użytkowników z wydarzeniami (relacja wiele-do-wielu).

---

## invites

* RLS: tak
* Kolumny:
  * id — uuid, domyślnie `gen_random_uuid()`, klucz główny
  * event_id — uuid
  * sender_id — uuid
  * receiver_id — uuid
  * status — enum `invite_status`, domyślnie 'pending' (wartości: pending, accepted, declined, canceled)
  * invite_code — text, nullable, unikalne
  * created_at — timestamptz, domyślnie now()
* Klucz główny: id
* Ograniczenia kluczy obcych:
  * `invites.event_id` → `public.events.id`
  * `invites.sender_id` → `auth.users.id`
  * `invites.receiver_id` → `auth.users.id`
* Uwagi:
  * Źródło zaproszeń do wydarzeń; używa statusu jako enum.

---

## votes

* RLS: tak
* 
* Kolumny:
  * id — uuid, domyślnie `gen_random_uuid()`, klucz główny
  * event_id — uuid
  * type — enum `vote_type` (wartości: time, location, general)
  * question — text
  * deadline — timestamptz, nullable
  * created_at — timestamptz, domyślnie now()
* Klucz główny: id
* Ograniczenia kluczy obcych:
  * `votes.event_id` → `public.events.id`
  * powiązanie z vote_options przez vote_options.vote_id
* Uwagi:
  * Reprezentuje ankiety/polls powiązane z wydarzeniami.

---

## vote_options

* RLS: tak
* Kolumny:
  * id — uuid, domyślnie `gen_random_uuid()`, klucz główny
  * vote_id — uuid
  * option_text — text
* Klucz główny: id
* Ograniczenia kluczy obcych:
  * `vote_options.vote_id` → `public.votes.id`
  * powiązanie z user_votes przez user_votes.vote_option_id
* Uwagi:
  * Opcje dla każdego głosowania.

---

## user_votes

* RLS: tak
* Kolumny:
  * user_id — uuid
  * vote_option_id — uuid
  * voted_at — timestamptz, domyślnie now()
* Klucz główny: (user_id, vote_option_id) — klucz złożony
* Ograniczenia kluczy obcych:
  * `user_votes.user_id` → `auth.users.id`
  * `user_votes.vote_option_id` → `public.vote_options.id`
* Uwagi:
  * Rejestruje, którzy użytkownicy głosowali na które opcje.

---

## notifications

* RLS: nie
* Kolumny:
  * id — uuid, domyślnie `gen_random_uuid()`, klucz główny
  * user_id — uuid
  * type — text
  * content — text, nullable
  * read — boolean, domyślnie false
  * created_at — timestamptz, domyślnie now()
  * target_id — uuid, nullable
* Klucz główny: id
* Ograniczenia kluczy obcych:
  * `notifications.user_id` → `auth.users.id`
* Uwagi:
  * Tabela powiadomień; RLS jest wyłączone — dostęp do niej może być kontrolowany innymi mechanizmami (np. API).

---

## friends

* RLS: tak
* Kolumny:
  * user_id — uuid
  * friend_id — uuid
  * status — enum `friend_status`, domyślnie 'requested' (wartości: requested, accepted, declined)
  * created_at — timestamptz, domyślnie now()
* Klucz główny: (user_id, friend_id)
* Ograniczenia kluczy obcych:
  * `friends.user_id` → `public.profiles.id`
  * `friends.friend_id` → `public.profiles.id`
* Uwagi:
  * Relacje znajomych między profilami. RLS włączone — prawdopodobnie tylko uczestnicy widzą swoje relacje.

---

## event_codes

* RLS: tak
* Wiersze: 62
* Kolumny:

  * id — uuid, domyślnie `gen_random_uuid()`, klucz główny
  * code — text, unikalne
  * event_id — uuid
  * expire_date — timestamptz, nullable
  * created_at — timestamptz, domyślnie now()
* Klucz główny: id
* Ograniczenia kluczy obcych:

  * `event_codes.event_id` → `public.events.id`
* Uwagi:

  * Kody wydarzeń do zaproszeń/dostępu. Zawiera datę wygaśnięcia.
  * 

## Trigers

### Tabela: events

* Trigger: generate_code_trigger
  * Definicja triggera: AFTER INSERT ON events FOR EACH ROW EXECUTE FUNCTION create_event_code_share()
  * Funkcja: create_event_code_share()
  * Cel:

    * Generuje unikalny 8-znakowy kod (alfanumeryczny, wielkie litery) po utworzeniu nowego rekordu wydarzenia i zapisuje go w tabeli event_codes powiązując z event_id.
  * Pełna definicja funkcji:

    ```sql
    DECLARE
        new_code TEXT;
        code_exists BOOLEAN;
    BEGIN
        -- Loop until we generate a unique code
        LOOP
            -- Generate 8-character alphanumeric code (uppercase)
            new_code := upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 8));

            -- Check if code already exists
            SELECT EXISTS(SELECT 1 FROM event_codes WHERE code = new_code) INTO code_exists;

            -- Exit loop if code is unique
            EXIT WHEN NOT code_exists;
        END LOOP;

        -- Insert the unique code with the event_id
        INSERT INTO event_codes (event_id, code)
        VALUES (NEW.id, new_code);

        RETURN NEW;
    END;
    ```
* Trigger: on_event_update
  * Definicja triggera: AFTER UPDATE ON events FOR EACH ROW EXECUTE FUNCTION handle_event_update_notification()
  * Funkcja: handle_event_update_notification()
  * Cel:
    * Po aktualizacji wydarzenia sprawdza, czy zmieniła się data lub lokalizacja; jeśli tak, tworzy powiadomienia (notifications) dla uczestników wydarzenia (users_events), z wyłączeniem twórcy wydarzenia.
  * Pełna definicja funkcji:
  * ```sql
    BEGIN
      IF (OLD.date IS DISTINCT FROM NEW.date OR OLD.location IS DISTINCT FROM NEW.location) THEN
        INSERT INTO notifications (user_id, type, content, "read")
        SELECT 
          user_id, 
          'event_update', 
          'Zmieniły się szczegóły wydarzenia: ' || NEW.name, 
          false
        FROM users_events
        WHERE event_id = NEW.id AND user_id != NEW.creator_id;
      END IF;
      RETURN NEW;
    END;

    ```

### Tabela: friends

* Trigger: on_friend_change
  * Definicja triggera: AFTER INSERT OR UPDATE ON friends FOR EACH ROW EXECUTE FUNCTION handle_friend_status_change()
  * Funkcja: handle_friend_status_change()
  * Cel:
    * Reaguje na dodanie zaproszenia (INSERT z status = 'requested') i wysyła powiadomienie do odbiorcy.
    * Reaguje na zmianę statusu z 'requested' na 'accepted' (UPDATE) i powiadamia nadawcę o akceptacji.
  * Pełna definicja funkcji:
  * ```sql
    BEGIN
      -- Nowe zaproszenie
      IF (TG_OP = 'INSERT' AND NEW.status = 'requested') THEN
        INSERT INTO notifications (user_id, type, content, "read")
        VALUES (NEW.friend_id, 'friend_request', 'Masz nowe zaproszenie do znajomych!', false);

      -- Akceptacja zaproszenia
      ELSIF (TG_OP = 'UPDATE' AND OLD.status = 'requested' AND NEW.status = 'accepted') THEN
        INSERT INTO notifications (user_id, type, content, "read")
        VALUES (NEW.user_id, 'friend_accepted', 'Twoje zaproszenie zostało zaakceptowane!', false);
      END IF;
      RETURN NEW;
    END;

    ```
* Trigger: on_friend_deleted
  * Definicja triggera: AFTER DELETE ON friends FOR EACH ROW EXECUTE FUNCTION handle_friend_deletion_notification()
  * Funkcja: handle_friend_deletion_notification()
  * Cel:

    * Po usunięciu rekordu friends wysyła odpowiednie powiadomienia zależnie od poprzedniego statusu (accepted/requested) oraz zweryfikowanego aktora (auth.uid()) — kto wykonał usunięcie.
  * Pełna definicja funkcji:

    ```sql

    DECLARE
      actor_id uuid;
    BEGIN
      -- Pobieramy ID osoby, która aktualnie klika "Usuń" lub "Odrzuć"
      actor_id := auth.uid();

      -- 1. USUNIĘCIE ZAAKCEPTOWANEGO ZNAJOMEGO
      IF (OLD.status = 'accepted') THEN
        -- Jeśli usuwa inicjator (user_id), powiadom znajomego (friend_id)
        IF (actor_id = OLD.user_id) THEN
          INSERT INTO notifications (user_id, type, content, "read")
          VALUES (OLD.friend_id, 'friend_removed', 'Użytkownik usunął Cię ze znajomych.', false);

        -- Jeśli usuwa znajomy (friend_id), powiadom inicjatora (user_id)
        ELSIF (actor_id = OLD.friend_id) THEN
          INSERT INTO notifications (user_id, type, content, "read")
          VALUES (OLD.user_id, 'friend_removed', 'Użytkownik usunął Cię ze znajomych.', false);
        END IF;

      -- 2. ODRZUCENIE LUB ANULOWANIE ZAPROSZENIA
      ELSIF (OLD.status = 'requested') THEN
        -- Jeśli osoba zaproszona (friend_id) odrzuca zaproszenie -> powiadom nadawcę (user_id)
        IF (actor_id = OLD.friend_id) THEN
          INSERT INTO notifications (user_id, type, content, "read")
          VALUES (OLD.user_id, 'friend_declined', 'Twoje zaproszenie do znajomych zostało odrzucone.', false);

        -- Jeśli nadawca (user_id) anuluje swoje zaproszenie -> nie wysyłaj nic do nikogo (cisza)
        END IF;
      END IF;

      RETURN OLD;
    END;

    ```

### Tabela: invites

* Trigger: on_event_invite
  * Definicja triggera: AFTER INSERT ON invites FOR EACH ROW EXECUTE FUNCTION handle_event_invitation()
  * Funkcja: handle_event_invitation()
  * Cel:
    * Po wstawieniu zaproszenia tworzy powiadomienie dla odbiorcy z treścią zawierającą nazwę wydarzenia oraz ustawia target_id na event_id.
  * Pełna definicja funkcji:
  * ```sql

    DECLARE
      event_name_text text;
    BEGIN
      SELECT name INTO event_name_text FROM events WHERE id = NEW.event_id;

      INSERT INTO notifications (user_id, type, content, "read", target_id) -- Dodano target_id
      VALUES (
        NEW.receiver_id, 
        'event_invite', 
        'Zostałeś zaproszony na wydarzenie: ' || COALESCE(event_name_text, 'Nowe Wydarzenie'), 
        false,
        NEW.event_id -- Tutaj przekazujemy ID wydarzenia
      );
      RETURN NEW;
    END;

    ```
  * Uwagi:
    * Pobiera nazwę wydarzenia z tabeli events; jeśli nie znajdzie, użyje 'Nowe Wydarzenie'.
    * Ustawia target_id w notifications na event_id, co ułatwia klientowi przekierowanie.
* Trigger: on_invitation_accepted
  * Definicja triggera: AFTER UPDATE ON invites FOR EACH ROW EXECUTE FUNCTION handle_invitation_status_update()
  * Funkcja: handle_invitation_status_update()
  * Cel:

    * Po zmianie statusu zaproszenia na 'accepted' wysyła powiadomienie do nadawcy informujące, kto zaakceptował zaproszenie oraz nazwę wydarzenia.
  * Pełna definicja funkcji:

    ```sql
    declare
      event_name_text text;
      responder_name text;
    begin
      -- Interweniujemy tylko gdy status zmienia się na 'accepted'
      if (old.status != 'accepted' and new.status = 'accepted') then

        select name into event_name_text from events where id = new.event_id;
        select username into responder_name from profiles where id = new.receiver_id;

        insert into notifications (user_id, type, content)
        values (
          new.sender_id,
          'invite_accepted',
          coalesce(responder_name, 'Ktoś') || ' zaakceptował zaproszenie na: ' || event_name_text
        );
      end if;

      return new;
    end;
    ```

### Tabela: votes

* Trigger: on_vote_closed
  * Definicja triggera: AFTER UPDATE ON votes FOR EACH ROW EXECUTE FUNCTION handle_vote_closed_notification()
  * Funkcja: handle_vote_closed_notification()
  * Cel:

    * Po ustawieniu deadline (kiedy wcześniej było NULL, a teraz jest NOT NULL) wysyła powiadomienia do wszystkich uczestników wydarzenia że głosowanie zostało zakończone.
  * Pełna definicja funkcji:

    ```sql

    DECLARE
      event_id_var uuid;
      event_name_var text;
    BEGIN
      IF (OLD.deadline IS NULL AND NEW.deadline IS NOT NULL) THEN
        SELECT e.id, e.name INTO event_id_var, event_name_var 
        FROM events e WHERE e.id = NEW.event_id;

        INSERT INTO notifications (user_id, type, content, "read")
        SELECT 
          user_id, 
          'vote_closed', 
          'Głosowanie w wydarzeniu "' || event_name_var || '" zostało zakończone.', 
          false
        FROM users_events
        WHERE event_id = event_id_var;
      END IF;
      RETURN NEW;
    END;

    ```
