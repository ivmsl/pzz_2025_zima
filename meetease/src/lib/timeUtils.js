/**
 * @file timeUtils.js
 * @brief Narzędzia do formatowania i walidacji daty i czasu
 * 
 * @exports formatDate - Formatowanie daty do formatu DD-MM-YYYY
 * @exports formatTime - Formatowanie czasu do formatu HH:MM
 * @exports validateDateFromDMY - Walidacja daty z formatu DD-MM-YYYY
 * @exports dayTimeToTimestampTZ - Konwersja daty i czasu do timestamp z uwzględnieniem strefy czasowej
 * @exports timestampTZToDayTime - Konwersja timestamp z uwzględnieniem strefy czasowej do daty i czasu
 */


/**
 * Formatowanie daty do formatu DD-MM-YYYY
 * 
 * @param {string} dateString - Data do formatowania
 * @returns {string} - Data w formacie DD-MM-YYYY
 */
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
  
  /**
   * Formatowanie czasu do formatu HH:MM
   * 
   * @param {string} timeString - Czas do formatowania
   * @returns {string} - Czas w formacie HH:MM
   */
  export const formatTime = (timeString) => {
    if (!timeString) return ""
    // If time is in HH:MM format, return as is
    if (timeString.match(/^\d{2}:\d{2}$/)) {
      return timeString
    }
    return timeString
  }


  /**
   * Walidacja daty z formatu DD-MM-YYYY
   * 
   * @param {string} dateString - Data do walidacji
   * @returns {boolean} - True jeśli data jest prawidłowa, false w przeciwnym razie
   */
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


  /**
   * Konwersja daty i czasu do timestamp z uwzględnieniem strefy czasowej
   * 
   * @param {string} date - Data do konwersji
   * @param {string} hour - Czas do konwersji
   * @returns {string} - Timestamp w formacie ISO
   */
export const dayTimeToTimestampTZ = (date, hour) => {
  const dateObj = new Date(`${date}T${hour}:00`);
  return dateObj.toISOString()
}


/**
 * Konwersja timestamp z uwzględnieniem strefy czasowej do daty i czasu
 * 
 * @param {string} timestampTZ - Timestamp do konwersji
 * @returns {Object} - Obiekt z polami date i time
 */
export const timestampTZToDayTime = (timestampTZ) => {
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