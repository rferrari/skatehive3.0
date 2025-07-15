export const ADMIN_USERS = ['xvlad', 'knowhow92', 'web-gnar', 'r4topunk', 'mengao'];

export const isAdmin = (username: string): boolean => {
    return ADMIN_USERS.includes(username.toLowerCase());
};
