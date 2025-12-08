"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, MapPin, Info, X, ChevronDown } from "lucide-react"
import TimePicker from "./time-picker"
import { searchUsersByUsername, fetchAllUsers } from "@/lib/userSearchActions"

export default function EventCreatorComponent({ user, onClose, onSubmit, eventData = null, participants = [] }) {
  const [formData, setFormData] = useState({
    name: "",
    date: "",
    startTime: "",
    endTime: "",
    location: "",
    description: "",
    creator_id: user.id,
    voting: false,
    participants: []
  })
  const [showStartTimePicker, setShowStartTimePicker] = useState(false)
  const [showEndTimePicker, setShowEndTimePicker] = useState(false)
  const [participantSearchQuery, setParticipantSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState([])
  const [allUsers, setAllUsers] = useState([])
  const [showParticipantDropdown, setShowParticipantDropdown] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [isLoadingUsers, setIsLoadingUsers] = useState(false)
  const startTimeRef = useRef(null)
  const endTimeRef = useRef(null)
  const participantSearchRef = useRef(null)

  const handleSubmit = (e) => {
    e.preventDefault()
    // Convert participant objects to IDs for submission
    const submitData = {
      ...formData,
      participants: formData.participants.map(p => typeof p === 'object' ? p.id : p)
    }
    onSubmit?.(submitData)
    onClose?.()
  }

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // Initialize participants from props if provided
  useEffect(() => {
    if (participants && participants.length > 0) {
      handleChange("participants", participants)
    }
  }, []) // Only run once on mount

  const validateDate = (dateString) => {
    if (!dateString || dateString.length !== 10) {
      return false
    }
    
    const [day, month, year] = dateString.split('-').map(Number)
    
    // Check if date is valid
    const date = new Date(year, month - 1, day)
    const isValidDate = 
      date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day &&
      month >= 1 && month <= 12 &&
      day >= 1 && day <= 31 &&
      year >= 1000 && year <= 9999
    
    if (!isValidDate) {
      return false
    }
    
    // Check if date is in the past
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    date.setHours(0, 0, 0, 0)
    
    return date >= today
  }

  const handleDateChange = (e) => {
    const input = e.target.value
    
    // Allow backspace/delete to clear
    if (input === '') {
      handleChange("date", '')
      return
    }
    
    // Remove all non-digit characters
    const digitsOnly = input.replace(/\D/g, '')
    
    // Format as DD-MM-YYYY
    let formatted = digitsOnly
    
    if (digitsOnly.length > 2) {
      formatted = digitsOnly.slice(0, 2) + '-' + digitsOnly.slice(2)
    }
    if (digitsOnly.length > 4) {
      formatted = digitsOnly.slice(0, 2) + '-' + digitsOnly.slice(2, 4) + '-' + digitsOnly.slice(4, 10)
    }
    
    // Limit to 10 characters (DD-MM-YYYY)
    if (formatted.length > 10) {
      formatted = formatted.slice(0, 10)
    }
    
    // Allow typing even if invalid, but validate on blur
    handleChange("date", formatted)
  }

  const handleDateBlur = (e) => {
    const dateString = e.target.value
    if (dateString && !validateDate(dateString)) {
      // Clear invalid date
      handleChange("date", '')
    }
  }

  const handleDateKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      const dateString = e.target.value
      if (dateString && !validateDate(dateString)) {
        // Clear invalid date
        handleChange("date", '')
      }
      e.target.blur()
    }
  }

  // Filter function to filter users based on search query
  const filterUsers = useCallback((users, query) => {
    if (!query || query.trim().length < 1) {
      return users
    }
    const searchTerm = query.trim().toLowerCase()
    return users.filter(user => 
      user.username?.toLowerCase().includes(searchTerm) ||
      user.email?.toLowerCase().includes(searchTerm)
    )
  }, [])

  // Load all users when dropdown is opened
  const loadAllUsers = useCallback(async () => {
    if (allUsers.length > 0) {
      // Already loaded, just filter them
      const filtered = filterUsers(allUsers, participantSearchQuery)
      const finalFiltered = filtered.filter(
        (user) => 
          user.id !== formData.creator_id &&
          !formData.participants.some((p) => p.id === user.id)
      )
      setSearchResults(finalFiltered)
      setShowParticipantDropdown(true)
      return
    }

    setIsLoadingUsers(true)
    try {
      const users = await fetchAllUsers()
      setAllUsers(users)
      // Filter out already selected participants and current user
      const filtered = filterUsers(users, participantSearchQuery)
      const finalFiltered = filtered.filter(
        (user) => 
          user.id !== formData.creator_id &&
          !formData.participants.some((p) => p.id === user.id)
      )
      setSearchResults(finalFiltered)
      setShowParticipantDropdown(true)
    } catch (error) {
      console.error("Error loading users:", error)
      setSearchResults([])
    } finally {
      setIsLoadingUsers(false)
    }
  }, [allUsers, participantSearchQuery, formData.creator_id, formData.participants, filterUsers])

  // Update filtered results when search query changes
  useEffect(() => {
    if (allUsers.length > 0 && showParticipantDropdown) {
      const filtered = filterUsers(allUsers, participantSearchQuery)
      const finalFiltered = filtered.filter(
        (user) => 
          user.id !== formData.creator_id &&
          !formData.participants.some((p) => p.id === user.id)
      )
      setSearchResults(finalFiltered)
    }
  }, [participantSearchQuery, allUsers, showParticipantDropdown, formData.creator_id, formData.participants, filterUsers])

  useEffect(() => {
    const handleClickOutside = (event) => {
      // Check if click is outside both time picker containers
      const clickedInsideStart = startTimeRef.current?.contains(event.target)
      const clickedInsideEnd = endTimeRef.current?.contains(event.target)
      const clickedInsideParticipant = participantSearchRef.current?.contains(event.target)
      
      if (!clickedInsideStart && showStartTimePicker) {
        setShowStartTimePicker(false)
      }
      if (!clickedInsideEnd && showEndTimePicker) {
        setShowEndTimePicker(false)
      }
      if (!clickedInsideParticipant && showParticipantDropdown) {
        setShowParticipantDropdown(false)
      }
    }

    if (showStartTimePicker || showEndTimePicker || showParticipantDropdown) {
      document.addEventListener("mousedown", handleClickOutside)
      return () => document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [showStartTimePicker, showEndTimePicker, showParticipantDropdown])

  const handleParticipantSelect = (user) => {
    // Add user object to participants
    handleChange("participants", [...formData.participants, user])
    setParticipantSearchQuery("")
    setSearchResults([])
    setShowParticipantDropdown(false)
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 overflow-visible">
      <div className="bg-white rounded-2xl shadow-xl w-[95vw] max-w-7xl h-[85vh] max-h-[85vh] overflow-x-visible relative flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-2xl font-semibold text-gray-900">Stwórz nowe Wydarzenie</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="flex gap-8 overflow-y-auto overflow-x-visible flex-1 p-8 pb-6">
            {/* Left Section */}
            <div className="flex-1 pb-4">
              {/* Event Name */}
              <div className="flex items-center gap-3" style={{ marginBottom: '1rem', marginTop: '1.2rem' }}>
                <Calendar className="w-5 h-5 text-gray-500 flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Nazwa Wydarzenia"
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Date */}
              <div className="flex items-center gap-3" style={{ marginBottom: '1rem' }}>
                <Calendar className="w-5 h-5 text-gray-500 flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Data, np: 30-05-2025"
                  value={formData.date}
                  onChange={handleDateChange}
                  onBlur={handleDateBlur}
                  onKeyDown={handleDateKeyDown}
                  maxLength={10}
                  className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Start Time and End Time */}
              <div className="flex gap-4 overflow-visible" style={{ marginBottom: '1rem' }}>
                <div className="flex items-center gap-3 flex-1 relative overflow-visible" ref={startTimeRef}>
                  <Clock className="w-5 h-5 text-gray-500 flex-shrink-0" />
                  <input
                    type="text"
                    placeholder="Godzina startowa"
                    value={formData.startTime}
                    readOnly
                    onClick={() => {
                      setShowStartTimePicker(true)
                      setShowEndTimePicker(false)
                    }}
                    className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    required
                  />
                  {showStartTimePicker && (
                    <div className="absolute top-full left-0 mt-2 z-[100] overflow-visible">
                      <TimePicker
                        value={formData.startTime}
                        onChange={(time) => {
                          handleChange("startTime", time)
                          setShowStartTimePicker(false)
                        }}
                        onClose={() => setShowStartTimePicker(false)}
                      />
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-3 flex-1 relative overflow-visible" ref={endTimeRef}>
                  <Clock className="w-5 h-5 text-gray-500 flex-shrink-0" />
                  <input
                    type="text"
                    placeholder="Godzina końcowa"
                    value={formData.endTime}
                    readOnly
                    onClick={() => {
                      setShowEndTimePicker(true)
                      setShowStartTimePicker(false)
                    }}
                    className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    required
                  />
                  {showEndTimePicker && (
                    <div className="absolute top-full left-0 mt-2 z-[100] overflow-visible">
                      <TimePicker
                        value={formData.endTime}
                        onChange={(time) => {
                          handleChange("endTime", time)
                          setShowEndTimePicker(false)
                        }}
                        onClose={() => setShowEndTimePicker(false)}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Location */}
              <div className="flex items-center gap-3" style={{ marginBottom: '1rem' }}>
                <MapPin className="w-5 h-5 text-gray-500 flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Lokalizacja"
                  value={formData.location}
                  onChange={(e) => handleChange("location", e.target.value)}
                  className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Voting Option */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="voting"
                  checked={formData.voting}
                  onChange={(e) => handleChange("voting", e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="voting" className="text-gray-700 cursor-pointer">
                  Głosowanie
                </label>
              </div>
            </div>

            {/* Right Section */}
            <div className="flex-1 space-y-6 pb-4">
              {/* Information Icon */}
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 mt-1">
                  <Info className="w-3 h-3 text-gray-600" />
                </div>
              </div>

              {/* Event Description */}
              <div>
                <textarea
                  placeholder="Opis Wydarzenia"
                  value={formData.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 h-40 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700 placeholder-gray-400"
                />
              </div>

              {/* Add Participants */}
              <div className="relative" style={{ marginTop: '0.46rem' }} ref={participantSearchRef}>
                <input
                  type="text"
                  placeholder="Dodaj Uczestników"
                  value={participantSearchQuery}
                  onChange={(e) => {
                    setParticipantSearchQuery(e.target.value)
                  }}
                  onFocus={() => {
                    loadAllUsers()
                  }}
                  onClick={() => {
                    if (!showParticipantDropdown) {
                      loadAllUsers()
                    }
                  }}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
                {showParticipantDropdown && (
                  <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg z-[100] max-h-60 overflow-y-auto">
                    {isLoadingUsers ? (
                      <div className="px-4 py-2 text-gray-500 text-sm">Ładowanie użytkowników...</div>
                    ) : searchResults.length > 0 ? (
                      searchResults.map((user) => (
                        <button
                          key={user.id}
                          type="button"
                          onClick={() => handleParticipantSelect(user)}
                          className="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors flex flex-col"
                        >
                          <span className="font-medium text-gray-900">{user.username}</span>
                          <span className="text-sm text-gray-500">{user.email}</span>
                        </button>
                      ))
                    ) : (
                      <div className="px-4 py-2 text-gray-500 text-sm">
                        {participantSearchQuery.length > 0 ? "Brak wyników" : "Brak dostępnych użytkowników"}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Selected Participants */}
              {formData.participants.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.participants.map((participant, index) => (
                    <span
                      key={participant.id || index}
                      className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center gap-2"
                      style={{ marginTop: '1rem' }}
                    >
                      {participant.username || participant.email || participant}
                      <button
                        type="button"
                        onClick={() => {
                          handleChange("participants", formData.participants.filter((_, i) => i !== index))
                        }}
                        className="hover:text-blue-900"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Footer - Fixed at bottom right */}
          <div className="flex justify-end gap-4 p-6 pt-4 border-t border-gray-200 flex-shrink-0">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              Anuluj
            </Button>
            <Button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Utwórz
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

