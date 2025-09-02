export const currentTimezone = (inputDate?: Date | string) => {
  // If no date is provided, use the current date and time
  const date = inputDate
    ? typeof inputDate === "string"
      ? new Date(inputDate)
      : inputDate
    : new Date();

  // Get the user's local timezone offset in minutes
  const timezoneOffset = new Date().getTimezoneOffset();

  // Calculate the date adjusted for the user's timezone
  const userTimezoneDate = new Date(
    date.getTime() - timezoneOffset * 60 * 1000
  );

  return userTimezoneDate;
};
