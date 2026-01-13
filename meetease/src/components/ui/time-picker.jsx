"use client"

import { useState, useRef, useEffect } from "react"
import { ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function TimePicker({ value, onChange, onClose }) {
  const [hours, setHours] = useState(10)
  const [minutes, setMinutes] = useState(0)
  const [showHoursDropdown, setShowHoursDropdown] = useState(false)
  const [showMinutesDropdown, setShowMinutesDropdown] = useState(false)

  const hoursRef = useRef(null)
  const minutesRef = useRef(null)
  const hoursButtonRef = useRef(null)
  const minutesButtonRef = useRef(null)
  
  const [hoursDropdownStyle, setHoursDropdownStyle] = useState({})
  const [minutesDropdownStyle, setMinutesDropdownStyle] = useState({})

  useEffect(() => {
    if (value) {
      // Parse existing time value if provided (format: H:MM or HH:MM)
      const timeMatch = value.match(/(\d+):(\d+)/)
      if (timeMatch) {
        const h = parseInt(timeMatch[1])
        const m = parseInt(timeMatch[2])
        
        // Convert to 24-hour format if needed, then to 1-24 range
        setHours(h >= 1 && h <= 24 ? h : (h % 24 || 24))
        setMinutes(m)
      }
    }
  }, [value])

  useEffect(() => {
    const updateHoursPosition = () => {
      if (hoursButtonRef.current && showHoursDropdown) {
        const rect = hoursButtonRef.current.getBoundingClientRect()
        setHoursDropdownStyle({
          position: 'fixed',
          top: `${rect.bottom + 4}px`,
          left: `${rect.left}px`,
          width: `${rect.width}px`,
        })
      }
    }

    const updateMinutesPosition = () => {
      if (minutesButtonRef.current && showMinutesDropdown) {
        const rect = minutesButtonRef.current.getBoundingClientRect()
        setMinutesDropdownStyle({
          position: 'fixed',
          top: `${rect.bottom + 4}px`,
          left: `${rect.left}px`,
          width: `${rect.width}px`,
        })
      }
    }

    if (showHoursDropdown) {
      updateHoursPosition()
      window.addEventListener('scroll', updateHoursPosition, true)
      window.addEventListener('resize', updateHoursPosition)
    }
    if (showMinutesDropdown) {
      updateMinutesPosition()
      window.addEventListener('scroll', updateMinutesPosition, true)
      window.addEventListener('resize', updateMinutesPosition)
    }

    return () => {
      window.removeEventListener('scroll', updateHoursPosition, true)
      window.removeEventListener('resize', updateHoursPosition)
      window.removeEventListener('scroll', updateMinutesPosition, true)
      window.removeEventListener('resize', updateMinutesPosition)
    }
  }, [showHoursDropdown, showMinutesDropdown])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (hoursRef.current && !hoursRef.current.contains(event.target)) {
        setShowHoursDropdown(false)
      }
      if (minutesRef.current && !minutesRef.current.contains(event.target)) {
        setShowMinutesDropdown(false)
      }
    }

    if (showHoursDropdown || showMinutesDropdown) {
      document.addEventListener("mousedown", handleClickOutside)
      return () => document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [showHoursDropdown, showMinutesDropdown])

  const handleApply = () => {
    const formattedTime = `${hours}:${minutes.toString().padStart(2, "0")}`
    onChange?.(formattedTime)
    onClose?.()
  }

  const hourOptions = Array.from({ length: 24 }, (_, i) => i + 1)
  const minuteOptions = Array.from({ length: 60 }, (_, i) => i)

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 w-80 border border-gray-200 relative overflow-visible">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Wybierz Czas</h3>
      
      {/* Time Input Fields */}
      <div className="flex items-center gap-2 mb-6 overflow-visible">
        {/* Hours Dropdown */}
        <div className="relative overflow-visible" ref={hoursRef}>
          <button
            ref={hoursButtonRef}
            type="button"
            onClick={() => {
              setShowHoursDropdown(!showHoursDropdown)
              setShowMinutesDropdown(false)
            }}
            className="bg-blue-50 text-blue-600 font-bold px-4 py-2 rounded-lg border border-blue-200 flex items-center gap-2 min-w-[80px] justify-between hover:bg-blue-100 transition-colors"
          >
            <span>{hours}</span>
            <ChevronDown className="w-4 h-4 text-blue-600" />
          </button>
          {showHoursDropdown && (
            <div 
              style={hoursDropdownStyle}
              className="bg-white border border-gray-200 rounded-lg shadow-lg z-[110] max-h-48 overflow-y-auto"
            >
              {hourOptions.map((hour) => (
                <button
                  key={hour}
                  type="button"
                  onClick={() => {
                    setHours(hour)
                    setShowHoursDropdown(false)
                  }}
                  className={`w-full px-4 py-2 text-left hover:bg-blue-50 transition-colors ${
                    hours === hour ? "bg-blue-100 text-blue-600 font-bold" : "text-gray-700"
                  }`}
                >
                  {hour}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Colon */}
        <span className="text-gray-700 text-xl font-semibold">:</span>

        {/* Minutes Dropdown */}
        <div className="relative overflow-visible" ref={minutesRef}>
          <button
            ref={minutesButtonRef}
            type="button"
            onClick={() => {
              setShowMinutesDropdown(!showMinutesDropdown)
              setShowHoursDropdown(false)
            }}
            className="bg-white text-gray-700 px-4 py-2 rounded-lg border border-gray-300 flex items-center gap-2 min-w-[80px] justify-between hover:bg-gray-50 transition-colors"
          >
            <span>{minutes.toString().padStart(2, "0")}</span>
            <ChevronDown className="w-4 h-4 text-gray-500" />
          </button>
          {showMinutesDropdown && (
            <div 
              style={minutesDropdownStyle}
              className="bg-white border border-gray-200 rounded-lg shadow-lg z-[110] max-h-48 overflow-y-auto"
            >
              {minuteOptions.map((minute) => (
                <button
                  key={minute}
                  type="button"
                  onClick={() => {
                    setMinutes(minute)
                    setShowMinutesDropdown(false)
                  }}
                  className={`w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors ${
                    minutes === minute ? "bg-gray-100 text-gray-900 font-semibold" : "text-gray-700"
                  }`}
                >
                  {minute.toString().padStart(2, "0")}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="ghost"
          onClick={onClose}
          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
        >
          Anuluj
        </Button>
        <Button
          type="button"
          onClick={handleApply}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          Zastosuj
        </Button>
      </div>
    </div>
  )
}

