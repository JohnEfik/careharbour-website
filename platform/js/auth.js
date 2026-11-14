// MVP sign-in. Accounts live on this device only (password hashed with PBKDF2),
// plus a guest option so a tired caregiver can start in one tap.
// Replace this module with a hosted auth provider before collecting accounts at
// scale — the rest of the app only uses currentUser / signIn / signUp / signOut.

import { local, session, KEYS } from "./store.js";

const ITERATIONS = 150000;

function toHex(buf) {
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");
}

async function hashPassword(password, saltHex) {
  const salt = new Uint8Array(saltHex.match(/../g).map((h) => parseInt(h, 16)));
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt, iterations: ITERATIONS, hash: "SHA-256" }, key, 256);
  return toHex(bits);
}

const normalize = (email) => email.trim().toLowerCase();

export function currentUser() {
  return local.get(KEYS.auth);
}

export async function signUp({ name, email, password }) {
  const accounts = local.get(KEYS.accounts, {});
  const id = normalize(email);
  if (accounts[id]) throw new Error("An account with that email already exists on this device. Try signing in.");
  const salt = toHex(crypto.getRandomValues(new Uint8Array(16)));
  accounts[id] = { name: name.trim(), salt, hash: await hashPassword(password, salt) };
  local.set(KEYS.accounts, accounts);
  const user = { name: name.trim(), email: id, guest: false };
  local.set(KEYS.auth, user);
  return user;
}

export async function signIn({ email, password }) {
  const accounts = local.get(KEYS.accounts, {});
  const id = normalize(email);
  const acct = accounts[id];
  if (!acct || (await hashPassword(password, acct.salt)) !== acct.hash) {
    throw new Error("That email and password don't match an account on this device.");
  }
  const user = { name: acct.name, email: id, guest: false };
  local.set(KEYS.auth, user);
  return user;
}

export function continueAsGuest() {
  const user = { name: null, email: null, guest: true };
  local.set(KEYS.auth, user);
  return user;
}

export function signOut() {
  local.remove(KEYS.auth);
  session.remove(KEYS.sim);
  session.remove(KEYS.report);
}
