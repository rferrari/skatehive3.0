import * as dhive from '@hiveio/dhive';

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
    let i, label, len, suffix;
    suffix = "Account name should ";
    if (!value) {
      return suffix + "not be empty.";
    }
    const length = value.length;
    if (length < 3) {
      return suffix + "be longer.";
    }
    if (length > 16) {
      return suffix + "be shorter.";
    }
    if (/\./.test(value)) {
      suffix = "Each account segment should ";
    }
    const ref = value.split(".");
    for (i = 0, len = ref.length; i < len; i++) {
      label = ref[i];
      if (!/^[a-z]/.test(label)) {
        return suffix + "start with a lowercase letter.";
      }
      if (!/^[a-z0-9-]*$/.test(label)) {
        return suffix + "have only lowercase letters, digits, or dashes.";
      }
      if (!/[a-z0-9]$/.test(label)) {
        return suffix + "end with a lowercase letter or digit.";
      }
      if (!(label.length >= 3)) {
        return suffix + "be longer";
      }
    }
    return null;
}

export const checkAccountExists = async (desiredUsername: string) => {
    try {
        const accounts = await client.database.getAccounts([desiredUsername]);
        return accounts.length === 0;
    } catch (error) {
        console.error('Error checking account:', error);
        return false;
    }
}; 