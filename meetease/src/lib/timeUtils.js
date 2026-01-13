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



  export const validateDateFromDMY = (dateString) => {
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


export const dayTimeToTimestampTZ = (date, hour) => {
  // const [day, month, year] = date.split('-').map(Number)
  // const [h, m] = hour.split(':').map(Number)
  // const dateObj = new Date(year, month - 1, day, h, m)
  const dateObj = new Date(`${date}T${hour}:00`);
  return dateObj.toISOString()
}

export const timestampTZToDayTime = (timestampTZ) => {
  console.log("timestampTZ:  ", timestampTZ)
  const dateObj = new Date(timestampTZ);

  // Format YYYY-MM-DD
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
  const day = String(dateObj.getDate()).padStart(2, '0');
  const formattedDate = `${year}-${month}-${day}`;

  // Format HH:mm
  const hours = String(dateObj.getHours()).padStart(2, '0');
  const minutes = String(dateObj.getMinutes()).padStart(2, '0');
  const formattedTime = `${hours}:${minutes}`;

  return {
    date: formattedDate,
    time: formattedTime,
  };
}