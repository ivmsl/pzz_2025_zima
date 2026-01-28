/**
 * @file dateTimeOptionField.jsx
 * @brief Pole opcji czasu w głosowaniu
 *
 * Renderuje pole opcji czasu w głosowaniu: data i czas startu/końca. Umożliwia edycję
 * daty i czasu oraz usuwanie opcji.
 *
 * @returns {JSX.Element} Pole opcji czasu w głosowaniu
 * 
 * @param {Object} opt - Opcja czasu
 * @param {number} idx - Indeks opcji
 * @param {Function} setOptions - Funkcja do ustawiania opcji
 * @param {boolean} delDisabled - Czy przycisk usuwania jest disabled
 * @param {boolean} disabled - Czy pole jest disabled
 *
 * @details
 * - Funkcja pobiera dane użytkownika za pomocą useState.
 */


import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"

export default function DateTimeOptionField( { opt, idx, setOptions, delDisabled = true, disabled = false } ) {

    return (
        <div key={idx} className="grid grid-cols-3 gap-4 py-2">
                          <input
                            type="date"
                            value={opt.date}
                            disabled={disabled}
                            onChange={(e) => {
                              const value = e.target.value
                              setOptions((prev) => prev.map((p, i) => (i === idx ? { ...p, date: value } : p)))
                            }}
                            placeholder="DD-MM-YYYY"
                            className="border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                          />
                          <input
                            type="time"
                            value={opt.start}
                            disabled={disabled}
                            onChange={(e) => {
                              const value = e.target.value
                              setOptions((prev) => prev.map((p, i) => (i === idx ? { ...p, start: value } : p)))
                            }}
                            placeholder="HH:MM start"
                            className="border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                          />
                          <div className="flex items-center gap-3">
                            <input
                              type="time"
                              value={opt.end}
                              disabled={disabled}
                              onChange={(e) => {
                                const value = e.target.value
                                setOptions((prev) => prev.map((p, i) => (i === idx ? { ...p, end: value } : p)))
                              }}
                              placeholder="HH:MM koniec"
                              className="flex-1 border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              onClick={() => {
                                setOptions((prev) => {
                                  if (prev.length <= 2) return prev
                                  return prev.filter((_, i) => i !== idx)
                                })
                              }}
                              disabled={delDisabled}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
            </div>
    )
}