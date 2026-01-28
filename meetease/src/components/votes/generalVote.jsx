/**
 * @file generalVote.jsx
 * @brief Formularz tworzenia/edycji jednego głosowania (ogólne, lokalizacja lub czas)
 *
 * Obsługuje trzy typy głosowań: "general", "location" (opcje tekstowe) i "time" (opcje
 * data + przedział czasowy). Zawiera pole pytania, opcjonalny deadline (data + godzina)
 * oraz listę opcji (min. 2) z możliwością dodawania i usuwania. Rodzic ma dostęp przez
 * ref do returnVoteDescriptor() i checkValidity() (useImperativeHandle).
 *
 * @component GeneralVote
 * @returns {JSX.Element} Karta z formularzem głosowania i przyciskiem „Dodaj opcję”
 *
 * @param {Object} props
 * @param {string} [props.eventId] - Id wydarzenia (do voteDescriptor.event_id)
 * @param {Object} [props.voteObj] - Istniejące dane głosowania do edycji: { voteDescriptor, options?, timedOptions? }
 * @param {string} props.type - Typ głosowania: "general" | "location" | "time"
 * @param {React.RefObject} [props.ref] - Ref z metodami: returnVoteDescriptor(), checkValidity()
 * @param {boolean} [props.disabled=false] - Wyłączenie pól i przycisku „Dodaj opcję”
 * @param {Object} [props.eventStart] - { date, startTime } — do walidacji deadline (deadline musi być przed startem wydarzenia)
 *
 * @state {Object} voteDescriptor - id, event_id, type, question, deadline, deadlineTime
 * @state {Array<string>} options - Opcje tekstowe (general/location); min. 2
 * @state {Array<Object>} timedOption - Opcje czasowe (time): { date, start, end }[]; min. 2
 *
 * @description
 * useImperativeHandle: returnVoteDescriptor() zwraca { voteDescriptor, options, timedOption };
 * checkValidity() sprawdza pytanie (niepuste, ≤100 znaków), min. 2 opcje, deadline (jeśli
 * ustawiony — oba pola; deadline przed eventStart / przed najwcześniejszą opcją time).
 * Dla type "time" waliduje też end > start i start opcji ≥ deadline. handleChange aktualizuje
 * voteDescriptor; addOptions dodaje opcję (GeneralOptionField dla general/location, DateTimeOptionField dla time).
 *
 * @see GeneralOptionField - Pole pojedynczej opcji tekstowej (@/components/votes/generalOptionField)
 * @see DateTimeOptionField - Pole opcji data+czas (@/components/votes/dateTimeOptionField)
 * @see Button - Przycisk „Dodaj opcję” (@/components/ui/button)
 */


import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import GeneralOptionField from "@/components/votes/generalOptionField";
import DateTimeOptionField from "@/components/votes/dateTimeOptionField";
import { useImperativeHandle } from "react";
import { useEffect } from "react";

// enum VoteType = "general" | "location" | "time"

export default function GeneralVote({
  eventId,
  voteObj,
  type,
  ref,
  disabled = false,
  eventStart = null,
}) {
  const timeToMinutes = (timeStr) => {
    if (!timeStr || !String(timeStr).includes(":")) return null;
    const [h, m] = String(timeStr)
      .split(":")
      .map((x) => Number(x));
    if (Number.isNaN(h) || Number.isNaN(m)) return null;
    return h * 60 + m;
  };

  const toDateTimeMs = (dateStr, timeStr) => {
    if (!dateStr || !timeStr) return null;
    const ms = new Date(`${dateStr}T${timeStr}:00`).getTime();
    return Number.isFinite(ms) ? ms : null;
  };

  const getEarliestTimedOptionStartMs = () => {
    const starts = (timedOption || [])
      .map((o) => toDateTimeMs(o?.date, o?.start))
      .filter((v) => typeof v === "number");
    if (!starts.length) return null;
    return Math.min(...starts);
  };

  const [voteDescriptor, setVoteDescriptor] = useState({
    id: voteObj?.voteDescriptor?.id || "",
    event_id: eventId || voteObj?.voteDescriptor?.event_id || "",
    type: voteObj?.voteDescriptor?.type || type || "general",
    question: voteObj?.voteDescriptor?.question || "",
    deadline: voteObj?.voteDescriptor?.deadline || "",
    deadlineTime: voteObj?.voteDescriptor?.deadlineTime || "",
  });
  const [options, setOptions] = useState(voteObj?.options || ["", ""]); //options OF TYPE { id, vote_id, option_text } ]
  const [timedOption, setTimedOption] = useState(
    voteObj?.timedOptions || [
      { date: "", start: "", end: "" },
      { date: "", start: "", end: "" },
    ],
  );

  useEffect(() => {
    if (voteObj) {
      console.log("voteObj is : ", voteObj);
    }
  }, [voteObj]);

  useImperativeHandle(ref, () => ({
    returnVoteDescriptor: () => {
      return {
        voteDescriptor,
        options,
        timedOption,
      };
    },
    checkValidity: () => {
      // Rule: if deadline is provided, it cannot be after event start time
      // - For fixed-time events, `eventStart` is passed from parent (EventCreator)
      // - For time-vote, we approximate event start as the earliest proposed option start
      const deadlineHasAny = !!(
        voteDescriptor.deadline || voteDescriptor.deadlineTime
      );
      const deadlineProvided = !!(
        voteDescriptor.deadline && voteDescriptor.deadlineTime
      );

      // If user starts setting a deadline, require both fields
      if (deadlineHasAny && !deadlineProvided) {
        return false;
      }

      const deadlineMs = deadlineProvided
        ? toDateTimeMs(voteDescriptor.deadline, voteDescriptor.deadlineTime)
        : null;

      if (deadlineProvided) {
        const eventStartMs =
          eventStart?.date && eventStart?.startTime
            ? toDateTimeMs(eventStart.date, eventStart.startTime)
            : type === "time"
              ? getEarliestTimedOptionStartMs()
              : null;

        // Voting must end no later than event start (i.e., event start >= deadline)
        if (
          deadlineMs !== null &&
          eventStartMs !== null &&
          deadlineMs > eventStartMs
        ) {
          return false;
        }
      }

      if (type === "general" || type === "location") {
        let isValid =
          voteDescriptor.question.trim() &&
          voteDescriptor.question.trim().length <= 100 &&
          options.length >= 2 &&
          voteDescriptor.deadline &&
          voteDescriptor.deadlineTime &&
          options.reduce((acc, curr) => acc && curr.trim(), true);
        return isValid && true;
      } else if (type === "time") {
        // Validate each timed option: must have date/start/end and end > start
        let isValid =
          voteDescriptor.question.trim() &&
          voteDescriptor.question.trim().length <= 100 &&
          timedOption.length >= 2 &&
          timedOption.reduce((acc, curr) => {
            const hasFields =
              acc && curr.date.trim() && curr.start.trim() && curr.end.trim();
            if (!hasFields) return false;

            const startMin = timeToMinutes(curr.start);
            const endMin = timeToMinutes(curr.end);
            if (startMin === null || endMin === null) return false;
            if (endMin <= startMin) return false;

            // If a voting deadline is set, event options cannot start before the deadline
            if (deadlineMs !== null) {
              const optStartMs = toDateTimeMs(curr.date, curr.start);
              if (optStartMs === null) return false;
              if (optStartMs < deadlineMs) return false;
            }

            return true;
          }, true);
        return isValid && true;
      } else return false;
    },
  }));

  const handleChange = (field, value) => {
    setVoteDescriptor((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const addOptions = () => {
    console.log("test");
    if (type === "time") {
      setTimedOption([...timedOption, { date: "", start: "", end: "" }]);
    } else {
      setOptions([...options, "Nowa opcja"]);
    }
  };

  return (
    <div>
      <div className="mt-8 border border-gray-200 rounded-2xl p-6 bg-gray-50">
        <div className="flex items-center justify-between gap-4 mb-4">
          <h3 className="text-xl font-semibold text-gray-900">
            Utwórz głosowanie{" "}
            {type === "location"
              ? "nad miejscem"
              : type === "time"
                ? "nad czasem"
                : "ogólne"}
          </h3>
          <Button
            type="button"
            variant="outline"
            onClick={addOptions}
            disabled={disabled}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Dodaj opcję
          </Button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nazwa głosowania
            </label>
            <input
              type="text"
              disabled={disabled}
              value={voteDescriptor.question}
              onChange={(e) => handleChange("question", e.target.value)}
              placeholder="Np. Gdzie idziemy na kolację?"
              maxLength="100"
              className="w-full border border-gray-300 rounded-lg px-5 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Termin zakończenia głosowania (opcjonalnie)
            </label>
            <div className="flex gap-3">
              <input
                type="date"
                disabled={disabled}
                value={voteDescriptor.deadline}
                onChange={(e) => handleChange("deadline", e.target.value)}
                className="flex-1 border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
              <input
                type="time"
                disabled={disabled}
                value={voteDescriptor.deadlineTime}
                onChange={(e) => handleChange("deadlineTime", e.target.value)}
                className="flex-1 border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Po upływie terminu głosowanie będzie zamknięte i nie będzie
              możliwe oddanie lub zmiana głosu.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Opcje (min. 2)
            </label>
            <div className="space-y-3">
              {(voteDescriptor.type === "general" ||
                voteDescriptor.type === "location") && (
                <>
                  {options.map((opt, idx) => (
                    <GeneralOptionField
                      key={idx}
                      opt={opt}
                      idx={idx}
                      setOptions={setOptions}
                      delDisabled={options.length <= 2}
                      disabled={disabled}
                    />
                  ))}
                </>
              )}
              {type === "time" && (
                <>
                  {timedOption.map((opt, idx) => (
                    <DateTimeOptionField
                      key={idx}
                      opt={opt}
                      idx={idx}
                      setOptions={setTimedOption}
                      delDisabled={timedOption.length <= 2}
                      disabled={disabled}
                    />
                  ))}
                </>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Głosowanie jest anonimowe — widoczne będą tylko wyniki w
              procentach.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
