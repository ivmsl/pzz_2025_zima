export const formatDate = (dateString) => {
    if (!dateString) return "Brak daty"
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString("pl-PL", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    } catch {
      return dateString
    }
  }
  
  export const formatTime = (timeString) => {
    if (!timeString) return ""
    // If time is in HH:MM format, return as is
    if (timeString.match(/^\d{2}:\d{2}$/)) {
      return timeString
    }
    return timeString
  }