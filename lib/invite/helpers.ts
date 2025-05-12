import * as dhive from '@hiveio/dhive';

export const client = new dhive.Client([
    "https://api.deathwing.me",
    "https://hive-api.arcange.eu",
    "https://api.hive.blog",
]);

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