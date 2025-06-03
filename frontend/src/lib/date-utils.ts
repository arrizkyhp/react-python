export const formatDateTimeUS = (timestamp: string): string => {
    const date = new Date(timestamp);

    const dateOptions: Intl.DateTimeFormatOptions = {
        year: "numeric",
        month: "numeric", // 'numeric' for 1, 2, 3...
        day: "numeric",
    };

    const timeOptions: Intl.DateTimeFormatOptions = {
        hour: "numeric", // 'numeric' for 1, 2, 3...
        minute: "2-digit", // '2-digit' for 01, 02, 03...
        second: "2-digit", // '2-digit' for 01, 02, 03...
        hour12: true, // Use 12-hour clock (AM/PM)
        timeZone: "Asia/Jakarta",
    };

    // Use a specific locale, 'en-US', to ensure consistent formatting
    const formattedDate = date.toLocaleDateString("en-US", dateOptions);
    const formattedTime = date.toLocaleTimeString("en-US", timeOptions);

    return `${formattedDate}, ${formattedTime}`;
};
