"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Calendar, Clock, MapPin, Info, X, ChevronDown, Plus, Trash2 } from "lucide-react"
import TimePicker from "@/components/ui/time-picker"
import { validateDateFromDMY } from "@/lib/timeUtils"
import SearchUserComponent from "@/components/users/searcUserComponent"
import GeneralVote from "@/components/votes/generalVote"
// import serverActions from "@/lib/serverActions"

export default function EventCreatorComponent({ user, onClose, onSubmit, userSearchFn, event = null, isEditing = false, participants = [] }) {
  // Convert date from YYYY-MM-DD to DD-MM-YYYY format
  const formatDateForInput = (dateString) => {
    if (!dateString) return ""
    const [year, month, day] = dateString.split('-')
    return `${day}-${month}-${year}`
  }

  const [formData, setFormData] = useState({
    id: event?.id || "",
    name: event?.name || "",
    date: event?.date ? formatDateForInput(event.date) : "",
    startTime: event?.time_start || "",
    endTime: event?.time_end || "",
    location: event?.location || "",
    description: event?.description || "",
    creator_id: user.id,
    voting: event?.time_poll_enabled || false,
    participants: event?.attendees || [],
    invitees: event?.invitees || [],
    voteObjects: event?.vote_objects || []
  })


  const [errors, setErrors] = useState({
    name: "",
    date: "",
    startTime: "",
    endTime: "",
    location: "",
    timeVote: "",
    locationVote: "", 
    votes: ""
  })

  const [voteNum, setVoteNum] = useState(0)
  const [doTimeVote, setDoTimeVote] = useState(event?.time_poll_enabled ? true : false || false)
  const [doLocationVote, setDoLocationVote] = useState(event?.location_poll_enabled ? true : false || false)


  const startTimeRef = useRef(null)
  const endTimeRef = useRef(null)

  //VOTES REFS
  const generalVoteRef = useRef([])
  const timeVoteRef = useRef(null)
  const locationVoteRef = useRef(null)

  const handleSubmit = (e) => {
    e.preventDefault()

    // Reset errors
    const newErrors = {}
    
    console.log("submitting formData", formData);

    // console.log("generalVoteRef: ", generalVoteRef)
    // console.log("generalVoteRef.current[0]: ", generalVoteRef.current[0]?.returnVoteDescriptor() || {})
    // console.log("generalVoteRef.current[1]: ", generalVoteRef.current[1]?.returnVoteDescriptor() || {})
    // console.log("generalVoteRef.current[0].checkValidity(): ", generalVoteRef.current[0]?.checkValidity() || false)
    // console.log("generalVoteRef.current[1].checkValidity(): ", generalVoteRef.current[1]?.checkValidity() || false)

    // Validate required fields
    if (!formData.name.trim()) {
      newErrors.name = "Nazwa wydarzenia jest wymagana"
    }

    if (!doTimeVote) {
      if (!formData.date) {
        newErrors.date = "Data jest wymagana i musi być prawidłowa"
      }
      if (!formData.startTime.trim()) {
        newErrors.startTime = "Godzina startowa jest wymagana"
      }
      if (!formData.endTime.trim()) {
        newErrors.endTime = "Godzina końcowa jest wymagana"
      }
    } else {
      if (!timeVoteRef.current?.checkValidity()) {
        newErrors.timeVote = "Głosowanie nad czasem jest nieprawidłowe"
      }
      if (!timeVoteRef.current) {
        newErrors.timeVote = "Wystąpił błąd podczas tworzenia głosowania nad czasem"
      }
    }
    
    if (!doLocationVote) {
      if (!formData.location.trim()) {
        newErrors.location = "Lokalizacja jest wymagana"
      }
    } else {
      if (!locationVoteRef.current?.checkValidity()) {
        newErrors.locationVote = "Głosowanie nad miejscem jest nieprawidłowe"
      }
      if (!locationVoteRef.current) {
        newErrors.locationVote = "Wystąpił błąd podczas tworzenia głosowania nad miejscem"
      }
    }

    for (const vote of generalVoteRef.current) {
      if (vote && !vote.checkValidity()) {
        newErrors.votes = "Głosowanie jest nieprawidłowe"
      }
    }


    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    const strTime = !doTimeVote ? formData.startTime : null
    const strDate = !doTimeVote ? formData.date : null
    const strEndTime = !doTimeVote ? formData.endTime : null
    const strLocation = !doLocationVote ? formData.location : null

    console.log("strTime is : ", strTime)
    console.log("strDate is : ", strDate)
    console.log("strEndTime is : ", strEndTime)
    console.log("strLocation is : ", strLocation)

    let formToSubmit = {
      ...formData,
      startTime: strTime,
      date: strDate,
      endTime: strEndTime,
      location: strLocation,
      time_poll_enabled: doTimeVote,
      location_poll_enabled: doLocationVote,
      voteObjects: {
        "time": doTimeVote ? timeVoteRef.current?.returnVoteDescriptor() || null : null,
        "location": doLocationVote ? locationVoteRef.current?.returnVoteDescriptor() || null : null,
        "general": voteNum > 0 ? generalVoteRef.current.map(vote => vote.returnVoteDescriptor()) || [] : [] 
      }
    }
    console.log("formToSubmit is : ", formToSubmit)
    // Clear errors and submit
    setErrors({})
    onSubmit?.(formToSubmit)
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
    console.log("event is : ", event)
  }, []) // Only run once on mount


  const addChosenUsers = (user) => {
    if (formData.participants.find(p => p.id === user.id)) {
      return
    }
    handleChange("participants", [...formData.participants, user])
  }
  const removeChosenUsers = (user) => {
    handleChange("participants", formData.participants.filter(p => p.id !== user.id))
  }


  
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 overflow-visible">
      <div className="bg-white rounded-2xl shadow-xl w-[95vw] max-w-7xl h-[85vh] max-h-[85vh] overflow-x-visible relative flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-2xl font-semibold text-gray-900">
            {isEditing ? "Edytuj Wydarzenie" : "Stwórz nowe Wydarzenie"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="overflow-y-auto overflow-x-visible flex-1 p-8 pb-6">
            <div className="flex gap-8 overflow-x-visible">
              {/* Left Section */}
              <div className="flex-1 pb-4">
              {/* Event Name */}

              <div className="flex items-start gap-3" style={{ marginBottom: '1rem', marginTop: '1.2rem' }}>
                <Calendar className="w-5 h-5 text-gray-500 flex-shrink-0 mt-2" />
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Nazwa Wydarzenia"
                    value={formData.name}
                    onChange={(e) => {
                      handleChange("name", e.target.value)
                      if (errors.name) {
                        setErrors(prev => ({ ...prev, name: "" }))
                      }
                    }}
                    className={`flex-1 w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 ${
                      errors.name ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-blue-500"
                    }`}
                    
                  />
                  {errors.name && (
                    <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                  )}
                </div>
              </div>

              {/* Date */}              
              <div className="flex items-start gap-3" style={{ marginBottom: '1rem' }}>
                <Calendar className="w-5 h-5 text-gray-500 shrink-0 mt-2" />
                <div className="flex-1">
                  <input
                    type="date"
                    placeholder="Data, np: 30-05-2025"
                    min={new Date().toISOString().split('T')[0]}
                    value={formData.date}
                    disabled={doTimeVote}
                    onChange={(e) => {
                      // handleDateChange(e)
                      handleChange("date", e.target.value || "")
                      if (errors.date) {
                        setErrors(prev => ({ ...prev, date: "" }))
                      }
                    }}
                    maxLength={10}
                    className={`flex-1 w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 ${
                      errors.date ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-blue-500"
                    }
                    bg-white`}
                  />
                  
                  {errors.date && (
                    <p className="text-red-500 text-sm mt-1">{errors.date}</p>
                  )}
                </div>
              </div>

              {/* Start Time and End Time */}
              <div className="flex gap-4 overflow-visible flex-row" style={{ marginBottom: '1rem' }}>
                <div className="flex items-start gap-3 flex-1 relative overflow-visible" ref={startTimeRef}>
                  <Clock className="w-5 h-5 text-gray-500 shrink-0 mt-2" />
                  <div className="flex-1 relative">
                    <input
                      type="time"
                      placeholder="Godzina startowa"
                      value={formData.startTime}
                      onChange={(e) => handleChange("startTime", e.target.value || "")}
                      disabled={doTimeVote}
                      className={`flex-1 w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 cursor-pointer ${
                        errors.startTime ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-blue-500"
                      }
                      bg-white
                      `}
                      
                    />
                    {errors.startTime && (
                      <p className="text-red-500 text-sm mt-1">{errors.startTime}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-start gap-3 flex-1 relative overflow-visible" ref={endTimeRef}>
                  <Clock className="w-5 h-5 text-gray-500 shrink-0 mt-2" />
                  <div className="flex-1 relative">
                    <input
                      type="time"
                      placeholder="Godzina końcowa"
                      value={formData.endTime}
                      disabled={doTimeVote}
                      onChange={(e) => handleChange("endTime", e.target.value || "")}
                      className={`flex-1 w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 cursor-pointer ${
                        errors.endTime ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-blue-500"
                      }
                      bg-white`}
                    />
                    {errors.endTime && (
                      <p className="text-red-500 text-sm mt-1">{errors.endTime}</p>
                    )}
                  </div>
                </div>
                <div className="flex-col items-center gap-3" >
                  <Checkbox checked={doTimeVote} onCheckedChange={(e) => setDoTimeVote(e)} 
                  className="w-5 h-5 text-gray-500 shrink-0 mt-2"/>
                  <p className="text-sm text-gray-500">Vote?</p>
                </div>
              </div>

              {/* Location */}
              <div className="flex items-center gap-3 " style={{ marginBottom: '1rem' }}>
                <MapPin className="w-5 h-5 text-gray-500 flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Lokalizacja (opcjonalnie przy głosowaniu miejsca)"
                  value={formData.location}
                  disabled={doLocationVote}
                  onChange={(e) => handleChange("location", e.target.value)}
                  className={`flex-1 border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 ${errors.location ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-blue-500"}`}
                />
              {errors.location && (
                  <p className="text-red-500 text-sm mt-1">{errors.location}</p>
                )}
              <div className="flex-col items-center gap-3" >
                  <Checkbox checked={doLocationVote} onCheckedChange={(e) => setDoLocationVote(e)} 
                  className="w-5 h-5 text-gray-500 shrink-0 mt-2"/>
                  <p className="text-sm text-gray-500">Vote?</p>
                </div>
                
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
              <SearchUserComponent searchUsersFn={userSearchFn} addChosenUsers={addChosenUsers} chosenUsers={formData.participants} />

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

              {formData.invitees.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.invitees.map((invitee, index) => (
                    <span
                      key={invitee.id || index}
                      className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center gap-2"
                      style={{ marginTop: '1rem' }}
                    >
                      {invitee.username || invitee.email || invitee } {" (oczekuje na potwierdzenie)"}
                      <button
                        type="button"
                        onClick={() => {
                          handleChange("invitees", formData.invitees.filter((_, i) => i !== index))
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

            {/* Voting */}
            <div className={`flex flex-col gap-4
              ${(errors.timeVote || errors.locationVote) ? "border-red-500 focus:ring-red-500 border-4" : ""}`}>
                {
                  doTimeVote &&
                  <GeneralVote user={user} eventId={formData.id} voteObj={event?.voteObjects?.time[0]}  type="time" ref={timeVoteRef} disabled={!!event?.id}/>

                  
                }
                {doTimeVote && errors.timeVote && (
                  <p className="text-red-500 text-sm mt-1">{errors.timeVote}</p>
                )}
                {
                  doLocationVote &&
                  <GeneralVote user={user} eventId={formData.id} voteObj={event?.voteObjects?.location[0]} type="location" ref={locationVoteRef} disabled={!!event?.id}/>
                }
                {doLocationVote && errors.locationVote && (
                  <p className="text-red-500 text-sm mt-1">{errors.locationVote}</p>
                )}
              
            </div>
            <div className="flex flex-row gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setVoteNum(prev => prev + 1)
                }}
              >
                Dodaj głosowanie ogólne
              </Button>
              
            </div>
            {voteNum > 0 && Array.from({ length: voteNum }).map((_, index) => (
                <GeneralVote user={user} key={index} eventId={formData.id} ref={(element) => {generalVoteRef.current[index] = element}}
                />
              ))}
           {errors.votes && (
            <p className="text-red-500 text-sm mt-1">{errors.votes}</p>
           )}
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
              // onClick={() => onSubmit(formData)}
            >
              {isEditing ? "Zapisz zmiany" : "Utwórz"}
            </Button>
          </div>

        </form>
      </div>
    </div>
  )
}

