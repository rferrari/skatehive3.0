export function getPostDate(date: string | Date): string {
    if (date === "just now") {
        return "just now";
    }
    const today = new Date();
    const created = new Date(date);

    const offset = today.getTimezoneOffset();
    const adjustedToday = new Date(today.getTime() + offset * 60000);
    const diffMs = adjustedToday.getTime() - created.getTime();
    const diffDays = Math.floor(diffMs / 86400000);
    const diffHrs = Math.floor(diffMs / 3600000);
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) {
        return "just now";
    } else if (diffMins < 60) {
        return `${diffMins}m`;
    } else if (diffHrs < 24) {
        return `${diffHrs}h`;
    } else if (diffDays < 31) {
        return `${diffDays}d`;
    } else {
        return `${created.getDate()}/${created.getMonth() + 1}/${created.getFullYear()}`;
    }
}