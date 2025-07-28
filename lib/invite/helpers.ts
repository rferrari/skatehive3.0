import * as dhive from '@hiveio/dhive';
import { validateHiveUsernameFormat, checkHiveAccountExists } from '@/lib/utils/hiveAccountUtils';

export const client = new dhive.Client([
    "https://api.deathwing.me",
    "https://hive-api.arcange.eu",
    "https://api.hive.blog",
]);


/**
 * @returns A random password for the new account.
 * This password is generated using the crypto API for security.
 * It creates a random seed and generates a private key from it.
 * The password is prefixed with 'SKATE000' to ensure it meets the length requirement
 * for Hive accounts.
 */
export const generatePassword = () => {
    const array = new Uint32Array(10);
    if (typeof window !== 'undefined' && window.crypto) {
      window.crypto.getRandomValues(array);
    } else if (typeof crypto !== 'undefined') {
      crypto.getRandomValues(array);
    }
    const key = 'SKATE000' + dhive.PrivateKey.fromSeed(array.toString()).toString();
    return key.substring(0, 25);
}

/** * Generates private keys for a given username and password.
 * @param {string} username - The username for which to generate private keys.
 * @param {string} password - The password used to generate the private keys.
 * @param {string[]} roles - An array of roles for which to generate keys.
 * @returns {object} An object containing the private keys for the specified roles. 
 * Each key is stored with its role as the key name.
 * The keys are generated using the dhive library's PrivateKey.fromLogin method.
 */

export const getPrivateKeys = (username: string, password: string, roles = ['owner', 'active', 'posting', 'memo']) => {
    const privKeys = {} as any;
    roles.forEach((role) => {
        privKeys[role] = dhive.PrivateKey.fromLogin(username, password, role as dhive.KeyRole).toString();
        privKeys[`${role}Pubkey`] = dhive.PrivateKey.from(privKeys[role]).createPublic().toString();
    });
    return privKeys;
};

export function validateAccountName(value: string) {
    const result = validateHiveUsernameFormat(value);
    return result.error; // Returns null if valid, error message if invalid
}

export const checkAccountExists = async (desiredUsername: string) => {
    try {
        const exists = await checkHiveAccountExists(desiredUsername);
        return !exists; // Note: invite logic expects TRUE when available (account doesn't exist)
    } catch (error) {
        console.error('Error checking account:', error);
        return false;
    }
}; 