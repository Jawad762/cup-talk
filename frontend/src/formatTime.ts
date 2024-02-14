export const formatTime = (date: Date) => {
    const dateObject = new Date(date);

    const options: Intl.DateTimeFormatOptions = {
      hour: '2-digit',
      minute: '2-digit',
    };

    const timezoneOffset = dateObject.getTimezoneOffset();

    dateObject.setMinutes(dateObject.getMinutes() - timezoneOffset);

    return dateObject.toLocaleString('en-US', options);
}

export const getCurrentTimestamp = () => {
  const dateObject = new Date();

  const timezoneOffset = dateObject.getTimezoneOffset();

  dateObject.setMinutes(dateObject.getMinutes() + timezoneOffset);

  return dateObject
}