export const formatTime = (date: Date) => {
  const dateObject = new Date(date);

  const options: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
  };

  return dateObject.toLocaleString('en-US', options);
}

export const getCurrentTimestamp = () => {
  const dateObject = new Date();

  return dateObject
}