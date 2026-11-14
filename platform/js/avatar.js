// MVP avatar for the video simulation: an animated SVG guide plus the browser's
// built-in text-to-speech. Captions are always on screen, so nothing depends on
// audio. A rendered, expressive avatar can replace avatarSvg() later.

import { local, KEYS } from "./store.js";

export const GUIDE_NAME = "Robin";

export function avatarSvg() {
  return `
<svg class="avatar" viewBox="0 0 200 200" role="img" aria-label="${GUIDE_NAME}, your guide">
  <circle cx="100" cy="100" r="96" class="avatar-bg"/>
  <g class="avatar-body">
    <path d="M38 196c4-34 30-52 62-52s58 18 62 52Z" class="avatar-shirt"/>
    <path d="M86 140h28v14a14 14 0 0 1-28 0Z" class="avatar-skin"/>
    <g class="avatar-head">
      <ellipse cx="100" cy="92" rx="40" ry="46" class="avatar-skin"/>
      <path d="M58 88c-2-32 18-52 44-52 25 0 44 18 41 50-6-14-18-22-30-24-14 8-38 12-55 26Z" class="avatar-hair"/>
      <g class="avatar-eyes">
        <ellipse cx="84" cy="94" rx="4.5" ry="5.5" class="avatar-feature"/>
        <ellipse cx="116" cy="94" rx="4.5" ry="5.5" class="avatar-feature"/>
      </g>
      <path d="M76 84q8-5 16 0M108 84q8-5 16 0" class="avatar-brow"/>
      <ellipse cx="72" cy="110" rx="7" ry="4" class="avatar-cheek"/>
      <ellipse cx="128" cy="110" rx="7" ry="4" class="avatar-cheek"/>
      <path d="M90 113q10 8 20 0" class="avatar-smile"/>
      <ellipse cx="100" cy="116" rx="7" ry="4" class="avatar-mouth"/>
    </g>
  </g>
</svg>`;
}

const supported = typeof window !== "undefined" && "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;

function pickVoice() {
  const voices = window.speechSynthesis.getVoices().filter((v) => v.lang && v.lang.startsWith("en"));
  const score = (v) =>
    (v.lang === "en-CA" ? 4 : 0) +
    (/natural|neural|online/i.test(v.name) ? 3 : 0) +
    (/google|samantha|aria|jenny/i.test(v.name) ? 2 : 0) +
    (v.localService ? 0 : 1);
  return voices.sort((a, b) => score(b) - score(a))[0] || null;
}

export function createVoice(avatarEl) {
  let muted = !!(local.get(KEYS.voice, {}).muted);
  let token = 0;

  const setSpeaking = (on) => avatarEl && avatarEl.classList.toggle("is-speaking", on);

  function stop() {
    token++;
    if (supported) window.speechSynthesis.cancel();
    setSpeaking(false);
  }

  function speak(text) {
    stop();
    if (!supported || muted) return;
    const mine = token;
    const u = new SpeechSynthesisUtterance(text);
    const voice = pickVoice();
    if (voice) u.voice = voice;
    u.rate = 0.95;
    u.onstart = () => mine === token && setSpeaking(true);
    u.onend = u.onerror = () => mine === token && setSpeaking(false);
    window.speechSynthesis.speak(u);
  }

  function setMuted(value) {
    muted = value;
    local.set(KEYS.voice, { muted });
    if (muted) stop();
  }

  return { supported, speak, stop, setMuted, isMuted: () => muted };
}
