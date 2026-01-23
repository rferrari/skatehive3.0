// lib/hive/server-functions.ts
'use server';

import { PrivateKey, KeyRole, Operation } from '@hiveio/dhive';
import { Buffer } from 'buffer';
import nodemailer from 'nodemailer';
import { EMAIL_DEFAULTS } from '@/config/app.config';
import HiveClient from "./hiveclient";

// import { DefaultRenderer } from "@hiveio/content-renderer";

// Note: signImageHash is now in server-actions.ts to avoid duplication
// Import from there if needed: import { signImageHash } from './server-actions';

export async function sendInvite(email: string, url: string): Promise<void> {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        throw new Error('Email environment variables (EMAIL_USER, EMAIL_PASS) must be set.');
    }

    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || EMAIL_DEFAULTS.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || EMAIL_DEFAULTS.SMTP_PORT),
        secure: process.env.SMTP_SECURE ? process.env.SMTP_SECURE === 'true' : EMAIL_DEFAULTS.SMTP_SECURE,
        auth: {
            user: process.env.EMAIL_USER,  // Your Gmail address
            pass: process.env.EMAIL_PASS,  // App password or your Gmail password if "less secure apps" is enabled
        },
    });

    // Email options
    const mailOptions = {
        from: process.env.EMAIL_USER || EMAIL_DEFAULTS.FROM_ADDRESS, // Sender address
        to: email, // Recipient address
        subject: 'Hive Invitation', // Subject link
        html: `<p>Click the following link to create your account:</p><a href="${url}">${url}</a>`, // Email body with reset link
    };

    // Send the email
    const mail = await transporter.sendMail(mailOptions);
    return
}

export const generatePassword = async () => {
    const array = new Uint32Array(10);
    crypto.getRandomValues(array);

    const key = PrivateKey.fromSeed(array.toString()).toString();
    return key.substring(0, 25);
}

export const getPrivateKeys = async (username: string, password: string, roles = ['owner', 'active', 'posting', 'memo']) => {
    const privKeys = {} as any;
    roles.forEach((role) => {
        privKeys[role] = PrivateKey.fromLogin(username, password, role as KeyRole).toString();
        privKeys[`${role}Pubkey`] = PrivateKey.from(privKeys[role]).createPublic().toString();
    });

    return privKeys;
};

export async function createAccount(username: string, password: string) {
    const creatorAccount = process.env.HIVE_ACCOUNT_CREATOR;
    const activeKey = process.env.HIVE_ACTIVE_KEY;

    if (!creatorAccount) {
        throw new Error("HIVE_ACCOUNT_CREATOR is not set in the environment");
    }

    if (!activeKey) {
        throw new Error("HIVE_ACTIVE_KEY is not set in the environment");
    }

    // Get private and public keys
    const keys = await getPrivateKeys(username, password);
    const { ownerPubkey, activePubkey, postingPubkey, memoPubkey } = keys;

    // Create the operation array
    const op: Operation = [
        'create_claimed_account',
        {
            creator: creatorAccount, // Creator account
            new_account_name: username, // New account name
            owner: {
                weight_threshold: 1,
                account_auths: [],
                key_auths: [[ownerPubkey, 1]], // Owner public key
            },
            active: {
                weight_threshold: 1,
                account_auths: [],
                key_auths: [[activePubkey, 1]], // Active public key
            },
            posting: {
                weight_threshold: 1,
                account_auths: [],
                key_auths: [[postingPubkey, 1]], // Posting public key
            },
            memo_key: memoPubkey, // Memo public key (no object here, just the public key string)
            json_metadata: '', // Optional metadata
            extensions: [] // Optional extensions
        },
    ];

    // Broadcast the operation using HiveClient
    try {
        await HiveClient.broadcast.sendOperations([op], PrivateKey.from(activeKey));
    } catch (error) {
        console.error('Error creating account:', error);
        throw error;
    }
}



