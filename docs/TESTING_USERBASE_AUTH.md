# Userbase Authentication Testing Guide

**Branch:** `userbase`  
**Date:** January 27, 2026  
**Testers:** Please report results in the testing spreadsheet or Discord thread

---

## Overview

We've implemented a new "lite user" system called **Userbase** that allows users to sign up and use Skatehive without needing a Hive blockchain account. This testing guide covers all authentication methods and their combinations.

---

## Testing Environment

- **URL:** `https://[staging-url]` or `http://localhost:3000`
- **Browser:** Chrome recommended (also test Firefox, Safari)
- **Extensions needed:** 
  - Hive Keychain (for Hive login tests)
  - MetaMask or similar (for Ethereum login tests)

---

## Test Scenarios

### 📧 Test 1: Email-Only Login (New User)

**Steps:**
1. Open the app in an incognito/private window
2. Click the login button in the sidebar (bottom left)
3. In the Connection Modal, find "App Account" section
4. Click "Sign up here" link
5. Enter a NEW email address (one you haven't used before)
6. Enter a unique handle (e.g., `tester-yourname-1`)
7. Click "Sign Up"
8. Check your email for the magic link
9. Click the magic link to complete sign up
10. You should be redirected back and logged in

**Expected Results:**
- [ ] Magic link email received within 2 minutes
- [ ] After clicking link, user is logged in
- [ ] Sidebar shows your handle/display name
- [ ] Can navigate to `/user/[your-handle]` and see your profile
- [ ] Edit profile button (pencil icon) appears on your profile
- [ ] Can edit display name, handle, bio, location, avatar, cover

**Report:**
```
Test 1 - Email Login (New User)
Result: PASS / FAIL
Issues: [describe any issues]
```

---

### 📧 Test 2: Email Login (Returning User)

**Steps:**
1. Open the app (can use same browser, or incognito)
2. Click login button
3. In "App Account" section, click "Sign in"
4. Enter the email you used in Test 1
5. Check email for magic link
6. Click link

**Expected Results:**
- [ ] Magic link received
- [ ] Logged in with same account as before
- [ ] Profile data (handle, avatar, etc.) persisted from before

**Report:**
```
Test 2 - Email Login (Returning)
Result: PASS / FAIL
Issues: [describe any issues]
```

---

### 🐝 Test 3: Hive Keychain Login Only

**Steps:**
1. Open app in incognito window (fresh session)
2. Make sure Hive Keychain extension is installed
3. Click login button
4. Click "Connect with Hive Keychain"
5. Approve the login in Keychain popup

**Expected Results:**
- [ ] Keychain popup appears
- [ ] After approval, logged in with Hive username
- [ ] Can navigate to `/user/[hive-username]`
- [ ] Profile shows Hive data (followers, following, posts, etc.)
- [ ] Snaps tab shows your snaps
- [ ] Can post snaps/content

**Report:**
```
Test 3 - Hive Keychain Only
Result: PASS / FAIL
Issues: [describe any issues]
```

---

### 💎 Test 4: Ethereum Wallet Login Only

**Steps:**
1. Open app in incognito window
2. Make sure MetaMask (or similar) is installed
3. Click login button
4. Click "Connect with Ethereum"
5. Select wallet and approve connection
6. Sign the message if prompted

**Expected Results:**
- [ ] Wallet popup appears
- [ ] After approval, logged in
- [ ] Profile shows wallet address or ENS name
- [ ] Can view tokens tab on profile
- [ ] Zora profile toggle available (if applicable)

**Report:**
```
Test 4 - Ethereum Only
Result: PASS / FAIL
Issues: [describe any issues]
```

---

### 🔗 Test 5: Email + Link Hive Identity

**Steps:**
1. Login with email first (Test 1 or 2)
2. Go to Settings page (`/settings`)
3. Find "Link Hive Account" section
4. Click "Link Hive Account"
5. Approve in Hive Keychain

**Expected Results:**
- [ ] Hive account successfully linked
- [ ] Profile now shows Hive data merged with userbase data
- [ ] Can post snaps that appear on Hive blockchain
- [ ] `/user/[hive-username]` shows your profile

**Report:**
```
Test 5 - Email + Link Hive
Result: PASS / FAIL
Issues: [describe any issues]
```

---

### 🔗 Test 6: Email + Link Ethereum Wallet

**Steps:**
1. Login with email first
2. Go to Settings page
3. Find "Link Ethereum Wallet" section
4. Click to connect wallet
5. Approve connection and sign message

**Expected Results:**
- [ ] Wallet successfully linked
- [ ] Can view tokens tab on profile
- [ ] Wallet address shown in settings

**Report:**
```
Test 6 - Email + Link Ethereum
Result: PASS / FAIL
Issues: [describe any issues]
```

---

### 🔗 Test 7: Hive First, Then Email

**Steps:**
1. Login with Hive Keychain first (fresh session)
2. Check if userbase account was auto-created
3. Go to Settings
4. Try to link/add email to account

**Expected Results:**
- [ ] Document what happens
- [ ] Is email linking available?
- [ ] Does it work?

**Report:**
```
Test 7 - Hive First + Email
Result: PASS / FAIL / NOT IMPLEMENTED
Issues: [describe any issues]
```

---

### 📝 Test 8: Post a Snap (Email-Only User)

**Steps:**
1. Login with email only (no Hive linked)
2. Click compose/post button
3. Create a snap with text and/or image
4. Submit

**Expected Results:**
- [ ] Snap posts successfully
- [ ] Snap appears on your profile's Snaps tab
- [ ] Snap appears in main feed
- [ ] Snap shows your display name (not "skateuser")

**Report:**
```
Test 8 - Post Snap (Email User)
Result: PASS / FAIL
Issues: [describe any issues]
```

---

### ❤️ Test 9: Vote on Content (Email-Only User)

**Steps:**
1. Login with email only
2. Find any post in the feed
3. Click the vote/like button
4. Check if vote registered

**Expected Results:**
- [ ] Vote submits successfully
- [ ] Vote count updates
- [ ] Your vote is remembered on page refresh

**Report:**
```
Test 9 - Vote (Email User)
Result: PASS / FAIL
Issues: [describe any issues]
```

---

### ✏️ Test 10: Edit Profile

**Steps:**
1. Login (any method)
2. Go to your profile page
3. Click the edit button (pencil icon near username)
4. Change display name
5. Upload new avatar
6. Upload cover image
7. Add bio and location
8. Save

**Expected Results:**
- [ ] Edit modal opens with SkateModal styling
- [ ] Can upload avatar (IPFS)
- [ ] Can upload cover (IPFS)
- [ ] Changes save successfully
- [ ] Profile updates immediately after save

**Report:**
```
Test 10 - Edit Profile
Result: PASS / FAIL
Issues: [describe any issues]
```

---

### 🚪 Test 11: Logout

**Steps:**
1. While logged in, click the user button in sidebar
2. Click "Sign Out" or "Disconnect"
3. Confirm logout

**Expected Results:**
- [ ] Successfully logged out
- [ ] Session cleared
- [ ] Redirected appropriately
- [ ] Can log back in

**Report:**
```
Test 11 - Logout
Result: PASS / FAIL
Issues: [describe any issues]
```

---

### 📱 Test 12: Mobile Experience

**Steps:**
1. Open app on mobile device or use browser dev tools mobile view
2. Test login flow
3. Test navigation
4. Test posting
5. Test profile viewing/editing

**Expected Results:**
- [ ] Login works on mobile
- [ ] UI is responsive
- [ ] Can navigate and use features

**Report:**
```
Test 12 - Mobile
Result: PASS / FAIL
Issues: [describe any issues]
```

---

## Known Issues (Don't Report These)

- WalletConnect initialization warnings in console (cosmetic)
- `/loadingsfx.mp3` 404 error (missing asset)
- Some Hive RPC "Invalid parameters" errors for non-existent usernames

---

## Bug Report Template

```markdown
## Bug Report

**Test Number:** #
**Tester:** [your name]
**Date:** 
**Browser/Device:** 

### Steps to Reproduce
1. 
2. 
3. 

### Expected Behavior


### Actual Behavior


### Screenshots/Console Errors
[attach if applicable]

### Severity
- [ ] Blocker (can't continue)
- [ ] Major (feature broken)
- [ ] Minor (cosmetic/inconvenient)
```

---

## Testing Checklist Summary

| Test | Description | Tester | Result |
|------|-------------|--------|--------|
| 1 | Email signup (new user) | | |
| 2 | Email login (returning) | | |
| 3 | Hive Keychain only | | |
| 4 | Ethereum only | | |
| 5 | Email + link Hive | | |
| 6 | Email + link Ethereum | | |
| 7 | Hive first + email | | |
| 8 | Post snap (email user) | | |
| 9 | Vote (email user) | | |
| 10 | Edit profile | | |
| 11 | Logout | | |
| 12 | Mobile | | |

---

## Questions to Answer

1. Is the login flow intuitive?
2. Are error messages clear when something fails?
3. Does the profile page correctly show your info?
4. Can you find the edit profile button easily?
5. Any confusion about handle vs display name?

---

## Contact

Report issues to: [Discord channel / GitHub issues / etc.]

Thanks for testing! 🛹
