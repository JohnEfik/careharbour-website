import { CONFIG } from "./config.js";
import { CONDITIONS, getCondition } from "./data/conditions.js";
import { parsePostalCode, lookupResources } from "./data/resources.js";
import { mentionsCrisis, faqAnswer, SUGGESTIONS } from "./data/assistant-faq.js";
import * as engine from "./engine.js";
import * as auth from "./auth.js";
import { local, session, KEYS } from "./store.js";
import { avatarSvg, createVoice, GUIDE_NAME } from "./avatar.js";
import { downloadReportPdf } from "./pdf.js";
import { esc, icon, crisisLinesHtml, disclaimerHtml, reportHtml } from "./ui.js";

const main = document.getElementById("main");
const announcer = document.getElementById("announcer");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const announce = (msg) => {
  announcer.textContent = "";
  setTimeout(() => (announcer.textContent = msg), 50);
};
const go = (path) => (location.hash = `#${path}`);
const backLink = (href, label) => `<a class="back-link" href="#${href}">${icon.back}<span>${esc(label)}</span></a>`;

/* ---------------- Crisis dialog (always available) ---------------- */

const crisisDialog = document.getElementById("crisisDialog");
document.getElementById("crisisDialogBody").innerHTML = crisisLinesHtml();
document.querySelectorAll("[data-crisis-open]").forEach((el) =>
  el.addEventListener("click", (e) => {
    if (typeof crisisDialog.showModal !== "function") return; // falls through to crisis.html
    e.preventDefault();
    crisisDialog.showModal();
  })
);
crisisDialog.addEventListener("click", (e) => {
  if (e.target === crisisDialog || e.target.closest("[data-crisis-close]")) crisisDialog.close();
});

/* ---------------- Header state ---------------- */

function renderHeader() {
  const user = auth.currentUser();
  const signOut = document.getElementById("signOutBtn");
  signOut.hidden = !user;
}
document.getElementById("signOutBtn").addEventListener("click", () => {
  auth.signOut();
  renderHeader();
  go("/");
});

/* ---------------- Views ---------------- */

function viewWelcome() {
  if (auth.currentUser()) return go("/home");
  main.innerHTML = `
    <section class="welcome">
      <div class="welcome__intro">
        <p class="eyebrow">For caregivers</p>
        <h1 tabindex="-1">A calm place to check in with yourself</h1>
        <p class="lead">Short, guided check-ins on the stress of caregiving, with practical, non-clinical suggestions and support near you.</p>
      </div>
      <div class="card auth-card">
        <button type="button" class="btn btn--primary btn--block" id="guestBtn">Continue without an account</button>
        <p class="hint center">Your reports are anonymous either way.</p>
        <div class="divider"><span>or</span></div>
        <div class="segmented" role="tablist" aria-label="Account">
          <button type="button" role="tab" id="tabIn" aria-selected="true" aria-controls="authForm">Sign in</button>
          <button type="button" role="tab" id="tabUp" aria-selected="false" aria-controls="authForm">Create account</button>
        </div>
        <form id="authForm" class="form" novalidate>
          <div class="field" id="nameField" hidden>
            <label for="name">First name or nickname</label>
            <input id="name" name="name" autocomplete="given-name" maxlength="40" />
          </div>
          <div class="field">
            <label for="email">Email</label>
            <input id="email" name="email" type="email" autocomplete="email" required />
          </div>
          <div class="field">
            <label for="password">Password</label>
            <input id="password" name="password" type="password" autocomplete="current-password" minlength="8" required aria-describedby="pwHint" />
            <p class="hint" id="pwHint">At least 8 characters.</p>
          </div>
          <p class="form-error" id="authError" role="alert"></p>
          <button class="btn btn--dark btn--block" type="submit" id="authSubmit">Sign in</button>
        </form>
        <p class="hint">Accounts are saved on this device for now.</p>
      </div>
    </section>`;

  let mode = "in";
  const $ = (id) => document.getElementById(id);
  const setMode = (m) => {
    mode = m;
    $("tabIn").setAttribute("aria-selected", m === "in");
    $("tabUp").setAttribute("aria-selected", m === "up");
    $("nameField").hidden = m === "in";
    $("authSubmit").textContent = m === "in" ? "Sign in" : "Create account";
    $("password").autocomplete = m === "in" ? "current-password" : "new-password";
    $("authError").textContent = "";
  };
  $("tabIn").onclick = () => setMode("in");
  $("tabUp").onclick = () => setMode("up");
  $("guestBtn").onclick = () => {
    auth.continueAsGuest();
    renderHeader();
    go("/home");
  };
  $("authForm").onsubmit = async (e) => {
    e.preventDefault();
    const email = $("email").value.trim();
    const password = $("password").value;
    const name = $("name").value.trim();
    const err = $("authError");
    if (!/^\S+@\S+\.\S+$/.test(email)) return (err.textContent = "Please enter a valid email address.");
    if (password.length < 8) return (err.textContent = "Your password needs at least 8 characters.");
    if (mode === "up" && !name) return (err.textContent = "Please add a first name or nickname.");
    $("authSubmit").disabled = true;
    try {
      mode === "in" ? await auth.signIn({ email, password }) : await auth.signUp({ name, email, password });
      renderHeader();
      go("/home");
    } catch (ex) {
      err.textContent = ex.message;
    } finally {
      $("authSubmit").disabled = false;
    }
  };
  return { title: "Welcome" };
}

function viewHome() {
  const user = auth.currentUser();
  main.innerHTML = `
    <section>
      <h1 tabindex="-1">${user.name ? `Hi, ${esc(user.name)}.` : "Welcome."} Where would you like to start?</h1>
      <p class="lead">Take your time. You can stop and come back whenever you need to.</p>
      <div class="choice-grid">
        <a class="choice" href="#/caregivers">
          <span class="choice__icon">${icon.heart}</span>
          <span class="choice__title">For Caregivers</span>
          <span class="choice__desc">A short guided check-in on work stress or burnout, with practical tips.</span>
        </a>
        <a class="choice" href="#/receivers">
          <span class="choice__icon">${icon.person}</span>
          <span class="choice__title">For Care Receivers <span class="badge">Coming soon</span></span>
          <span class="choice__desc">Support for the people receiving care.</span>
        </a>
        <a class="choice" href="#/assistant">
          <span class="choice__icon">${icon.spark}</span>
          <span class="choice__title">AI Assistant</span>
          <span class="choice__desc">Ask general questions about caregiving or using this platform.</span>
        </a>
      </div>
    </section>`;
  return { title: "Home" };
}

function viewConditions() {
  const cards = CONDITIONS.map((c) =>
    c.status === "available"
      ? `<li><a class="condition" href="#/caregivers/${c.id}">
           <span class="condition__title">${esc(c.title)}</span>
           <span class="condition__desc">${esc(c.blurb)}</span>
           <span class="condition__go">${icon.arrow}</span>
         </a></li>`
      : `<li><div class="condition condition--soon" aria-disabled="true">
           <span class="condition__title">${esc(c.title)} <span class="badge">Coming soon</span></span>
           <span class="condition__desc">${esc(c.blurb)}</span>
         </div></li>`
  ).join("");
  main.innerHTML = `
    ${backLink("/home", "Home")}
    <h1 tabindex="-1">What's weighing on you most right now?</h1>
    <p class="lead">Choose one to start. Each check-in is about 6 questions and takes 2 to 3 minutes.</p>
    <ul class="condition-list">${cards}</ul>`;
  return { title: "Choose a check-in" };
}

function savedSim(condId) {
  const s = session.get(KEYS.sim);
  return s && s.conditionId === condId && s.cursor > 0 ? s : null;
}

function viewFormat({ cond }) {
  const condition = getCondition(cond);
  if (!condition) return go("/caregivers");
  const resume = savedSim(cond);
  main.innerHTML = `
    ${backLink("/caregivers", "All check-ins")}
    <p class="eyebrow">${esc(condition.title)}</p>
    <h1 tabindex="-1">How would you like to do this check-in?</h1>
    <p class="lead">Same questions either way. You can go back and change an answer at any time.</p>
    ${resume ? `<a class="card resume" href="#/sim/${cond}/${resume.format}"><strong>Pick up where you left off</strong><span>${resume.format === "video" ? "Video" : "Text"} · question ${resume.cursor + 1}</span></a>` : ""}
    <div class="choice-grid choice-grid--two">
      <a class="choice" href="#/sim/${cond}/video" data-fresh>
        <span class="choice__icon">${icon.video}</span>
        <span class="choice__title">Video</span>
        <span class="choice__desc">${GUIDE_NAME}, a friendly guide, reads each question aloud. Captions are always on.</span>
      </a>
      <a class="choice" href="#/sim/${cond}/text" data-fresh>
        <span class="choice__icon">${icon.text}</span>
        <span class="choice__title">Text</span>
        <span class="choice__desc">Read and tap at your own pace. Quiet and quick.</span>
      </a>
    </div>`;
  main.querySelectorAll("[data-fresh]").forEach((a) => a.addEventListener("click", () => session.remove(KEYS.sim)));
  return { title: `${condition.title} — choose a format` };
}

function viewSim({ cond, format }) {
  const condition = getCondition(cond);
  if (!condition || !["video", "text"].includes(format)) return go("/caregivers");

  let state = session.get(KEYS.sim);
  if (!state || state.conditionId !== cond) state = engine.startSession(condition, format);
  state.format = format;

  const isVideo = format === "video";
  main.innerHTML = `
    <div class="sim sim--${format}">
      <div class="sim__top">
        <button type="button" class="back-link" id="simBack">${icon.back}<span>Back</span></button>
        <a class="link-quiet" href="#/caregivers/${cond}">Exit</a>
      </div>
      <div class="progress">
        <p class="progress__label" id="progressLabel"></p>
        <div class="progress__bar" role="progressbar" aria-labelledby="progressLabel" aria-valuemin="0" id="progressBar"><span></span></div>
      </div>
      ${isVideo ? `
        <div class="stage">
          <div class="stage__avatar" id="avatar">${avatarSvg()}</div>
          <div class="stage__controls">
            <button type="button" class="btn btn--ghost btn--sm" id="replayBtn">Replay</button>
            <button type="button" class="btn btn--ghost btn--sm" id="muteBtn" aria-pressed="false">Mute voice</button>
          </div>
        </div>` : ""}
      <div class="sim__body" id="simBody"></div>
    </div>`;

  const body = document.getElementById("simBody");
  const voice = isVideo ? createVoice(document.getElementById("avatar")) : null;
  let advancing = false;

  if (voice) {
    const muteBtn = document.getElementById("muteBtn");
    const syncMute = () => {
      muteBtn.setAttribute("aria-pressed", voice.isMuted());
      muteBtn.textContent = voice.isMuted() ? "Turn voice on" : "Mute voice";
    };
    syncMute();
    muteBtn.onclick = () => {
      voice.setMuted(!voice.isMuted());
      syncMute();
      if (!voice.isMuted()) speakCurrent();
    };
    document.getElementById("replayBtn").onclick = () => speakCurrent();
    if (!voice.supported) {
      muteBtn.hidden = true;
      document.getElementById("replayBtn").hidden = true;
    }
  }

  let currentSpeech = "";
  const speakCurrent = () => voice && voice.speak(currentSpeech);

  function render() {
    const step = engine.getStep(condition, state);
    if (step.type === "complete") return finish();
    session.set(KEYS.sim, state);

    const { question, index, total, selected } = step;
    const intro = isVideo && index === 0
      ? `Hi, I'm ${GUIDE_NAME}. I'll ask you a few questions about ${condition.title.toLowerCase()}. There are no right or wrong answers. `
      : "";
    const label = question.isFollowUp ? "One more question" : `Question ${index + 1} of ${condition.questions.length}`;
    document.getElementById("progressLabel").textContent = label;
    const bar = document.getElementById("progressBar");
    bar.setAttribute("aria-valuemax", total);
    bar.setAttribute("aria-valuenow", index);
    bar.firstElementChild.style.width = `${(index / total) * 100}%`;
    document.getElementById("simBack").hidden = index === 0;

    body.innerHTML = `
      ${question.safety ? `<p class="gentle-note">This next question is more personal. Your honest answer helps us show you the right support.</p>` : ""}
      <div class="${isVideo ? "caption" : ""}">
        ${intro ? `<p class="caption__intro">${esc(intro)}</p>` : ""}
        <h1 class="question" tabindex="-1">${esc(question.text)}</h1>
      </div>
      <div class="options" role="group" aria-label="Answer options">
        ${question.options
          .map(
            (o) => `<button type="button" class="option" data-id="${o.id}" aria-pressed="${o.id === selected}">
              <span class="option__letter" aria-hidden="true">${o.id}</span>
              <span class="option__text">${esc(o.text)}</span>
            </button>`
          )
          .join("")}
      </div>`;

    body.querySelectorAll(".option").forEach((btn) =>
      btn.addEventListener("click", () => {
        if (advancing) return;
        advancing = true;
        body.querySelectorAll(".option").forEach((b) => b.setAttribute("aria-pressed", b === btn));
        setTimeout(() => {
          state = engine.answer(condition, state, btn.dataset.id);
          advancing = false;
          render();
        }, reducedMotion ? 0 : 260);
      })
    );

    currentSpeech = `${intro}${question.text} ${question.options.map((o) => `${o.id}: ${o.text}.`).join(" ")}`;
    speakCurrent();
    body.querySelector(".question").focus({ preventScroll: false });
  }

  function finish() {
    const report = engine.buildReport(condition, state);
    session.set(KEYS.report, report);
    session.remove(KEYS.sim);
    go("/summary");
  }

  document.getElementById("simBack").onclick = () => {
    state = engine.back(state);
    render();
  };

  render();
  return { title: `${condition.title} check-in`, cleanup: () => voice && voice.stop(), managesFocus: true };
}

function noReport() {
  main.innerHTML = `
    <h1 tabindex="-1">There's no summary to show yet</h1>
    <p class="lead">Summaries are kept only while this tab is open. Start a check-in to create a new one.</p>
    <a class="btn btn--primary" href="#/caregivers">Start a check-in</a>`;
  return { title: "No summary" };
}

function viewSummary() {
  const report = session.get(KEYS.report);
  if (!report) return noReport();
  main.innerHTML = `
    <div class="report">
      <p class="eyebrow">Your summary</p>
      <h1 tabindex="-1">${esc(report.conditionTitle)} check-in</h1>
      ${reportHtml(report)}
      <section class="card card--accent next-step no-print" aria-labelledby="connectHeading">
        <h2 id="connectHeading">Would you like to connect to community resources?</h2>
        <p>We'll ask a few quick questions about this check-in, then show caregiver supports and professionals near your postal code.</p>
        <div class="btn-row">
          <a class="btn btn--primary" href="#/survey/resources">Yes, show me resources</a>
          <a class="btn btn--ghost" href="#/survey/download">No, thanks</a>
        </div>
      </section>
    </div>`;
  if (report.crisis) announce("Crisis support lines are shown at the top of your summary.");
  return { title: "Your summary" };
}

const SURVEY = [
  { id: "helpful", q: "How helpful did this check-in feel?", options: ["1", "2", "3", "4", "5"], ends: ["Not helpful", "Very helpful"] },
  { id: "ease", q: "How easy was it to use?", options: ["1", "2", "3", "4", "5"], ends: ["Very hard", "Very easy"] },
  { id: "relevant", q: "Did the suggestions feel relevant to your situation?", options: ["Yes", "Somewhat", "Not really"] },
  { id: "recommend", q: "Would you recommend this to another caregiver?", options: ["Yes", "Maybe", "No"] },
];

function viewSurvey({ next }) {
  const report = session.get(KEYS.report);
  if (!report) return noReport();
  const dest = next === "resources" ? "/resources" : "/download";
  main.innerHTML = `
    ${backLink("/summary", "Back to summary")}
    <h1 tabindex="-1">A few quick questions</h1>
    <p class="lead">This helps us improve. Every question is optional, and your answers stay anonymous.</p>
    <form class="form survey" id="surveyForm">
      ${SURVEY.map(
        (s) => `<fieldset class="card">
          <legend>${esc(s.q)}</legend>
          ${s.ends ? `<p class="scale-ends" aria-hidden="true"><span>${s.ends[0]}</span><span>${s.ends[1]}</span></p>` : ""}
          <div class="pill-group${s.ends ? " pill-group--scale" : ""}">
            ${s.options
              .map((o, i) => {
                const aria = s.ends && (i === 0 || i === s.options.length - 1) ? ` aria-label="${o} — ${i === 0 ? s.ends[0] : s.ends[1]}"` : "";
                return `<label class="pill"><input type="radio" name="${s.id}" value="${o}"${aria} /><span>${o}</span></label>`;
              })
              .join("")}
          </div>
        </fieldset>`
      ).join("")}
      <div class="field card">
        <label for="comment">Anything else you'd like to tell us? <span class="hint">(optional)</span></label>
        <textarea id="comment" name="comment" rows="3" maxlength="500" aria-describedby="commentHint"></textarea>
        <p class="hint" id="commentHint">Please don't include names or other personal details.</p>
      </div>
      <div class="btn-row">
        <button class="btn btn--primary" type="submit">Continue</button>
        <a class="link-quiet" href="#${dest}">Skip</a>
      </div>
    </form>`;

  document.getElementById("surveyForm").onsubmit = (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));
    const entry = {
      anonymousId: report.anonymousId,
      condition: report.conditionId,
      band: report.band.id,
      format: report.format,
      choseResources: next === "resources",
      ...data,
      submittedAt: new Date().toISOString(),
    };
    local.set(KEYS.surveys, [...local.get(KEYS.surveys, []), entry]);
    if (CONFIG.surveyEndpoint) {
      fetch(CONFIG.surveyEndpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(entry), keepalive: true }).catch(() => {});
    }
    announce("Thank you. Your feedback was saved.");
    go(dest);
  };
  return { title: "Quick survey" };
}

function downloadButton() {
  return `<button type="button" class="btn btn--primary" data-download>Download your summary (PDF)</button>`;
}

function wireDownload(report) {
  main.querySelectorAll("[data-download]").forEach((btn) =>
    btn.addEventListener("click", async () => {
      btn.disabled = true;
      const label = btn.textContent;
      btn.textContent = "Preparing your PDF…";
      try {
        const how = await downloadReportPdf(report);
        announce(how === "pdf" ? "Your summary PDF has been downloaded." : "Opening the print dialog. Choose Save as PDF to keep a copy.");
      } finally {
        btn.disabled = false;
        btn.textContent = label;
      }
    })
  );
}

// Hidden on screen; used when the PDF library can't load and we print instead.
const printCopy = (report) => `<div class="print-only">${reportHtml(report, { headingLevel: 3 })}</div>`;

function viewResources() {
  const report = session.get(KEYS.report);
  main.innerHTML = `
    <div class="no-print">
      ${backLink("/summary", "Back to summary")}
      <h1 tabindex="-1">Find support near you</h1>
      <p class="lead">Enter your postal code to see caregiver supports, community organizations, and professionals in your area. We don't save it.</p>
      <form class="form postal-form card" id="postalForm" novalidate>
        <div class="field">
          <label for="postal">Postal code</label>
          <input id="postal" name="postal" autocomplete="postal-code" inputmode="text" maxlength="7" placeholder="e.g. M5V 2T6" aria-describedby="postalError" />
        </div>
        <button class="btn btn--primary" type="submit">Show resources</button>
        <p class="form-error" id="postalError" role="alert"></p>
      </form>
      <div id="results" aria-live="polite"></div>
      ${report ? `<div class="btn-row">${downloadButton(report)}<a class="btn btn--ghost" href="#/home">Back to home</a></div>` : ""}
    </div>
    ${report ? printCopy(report) : ""}`;

  if (report) wireDownload(report);
  document.getElementById("postalForm").onsubmit = (e) => {
    e.preventDefault();
    const err = document.getElementById("postalError");
    const postal = parsePostalCode(document.getElementById("postal").value);
    if (!postal) {
      err.textContent = "That doesn't look like a Canadian postal code. Please try a format like M5V 2T6.";
      document.getElementById("postal").setAttribute("aria-invalid", "true");
      return;
    }
    err.textContent = "";
    document.getElementById("postal").removeAttribute("aria-invalid");
    const { regionName, groups } = lookupResources(postal);
    document.getElementById("results").innerHTML = `
      <h2 class="results-heading">Resources for ${esc(postal.formatted)} · ${esc(regionName)}</h2>
      ${groups
        .filter((g) => g.items.length)
        .map(
          (g) => `<section class="resource-group">
            <h3>${esc(g.title)}</h3>
            <ul class="resource-list">${g.items
              .map(
                (r) => `<li class="resource card">
                  <p class="resource__name">${esc(r.name)}</p>
                  <p class="resource__desc">${esc(r.desc)}</p>
                  <div class="btn-row">
                    ${r.phone ? `<a class="btn btn--ghost btn--sm" href="tel:${esc(r.phone.replace(/[^\d]/g, ""))}">${icon.phone}<span>Call ${esc(r.phone)}</span></a>` : ""}
                    ${r.url ? `<a class="btn btn--ghost btn--sm" href="${esc(r.url)}" target="_blank" rel="noopener">${icon.link}<span>Website<span class="sr-only"> for ${esc(r.name)} (opens in a new tab)</span></span></a>` : ""}
                  </div>
                </li>`
              )
              .join("")}</ul>
          </section>`
        )
        .join("")}
      <p class="hint">This is a curated starter list. Please confirm hours and details directly with each organization. For anything not listed, call 2-1-1.</p>`;
    announce(`Showing resources for ${regionName}.`);
  };
  return { title: "Find support near you" };
}

function viewDownload() {
  const report = session.get(KEYS.report);
  if (!report) return noReport();
  main.innerHTML = `
    <div class="no-print">
      <h1 tabindex="-1">Thank you for taking a moment for yourself</h1>
      <p class="lead">Here's a copy of your summary to keep. It has your answers and the suggestions, labelled only with your anonymous ID <strong>${esc(report.anonymousId)}</strong>.</p>
      <div class="btn-row">
        ${downloadButton(report)}
        <a class="btn btn--ghost" href="#/summary">View summary again</a>
      </div>
      <p class="hint">Changed your mind? <a href="#/resources">Find community resources near you</a>.</p>
      ${disclaimerHtml()}
      <a class="btn btn--dark" href="#/home">Back to home</a>
    </div>
    ${printCopy(report)}`;
  wireDownload(report);
  return { title: "Download your summary" };
}

function viewReceivers() {
  main.innerHTML = `
    ${backLink("/home", "Home")}
    <h1 tabindex="-1">For Care Receivers is coming soon</h1>
    <p class="lead">We're starting with support for caregivers and will add check-ins for people receiving care in a later update.</p>
    <div class="btn-row">
      <a class="btn btn--primary" href="#/assistant">Ask the AI Assistant</a>
      <a class="btn btn--ghost" href="#/home">Back to home</a>
    </div>`;
  return { title: "For Care Receivers" };
}

function viewCrisis() {
  main.innerHTML = `
    <h1 tabindex="-1">Support is available right now</h1>
    <p class="lead">If you're thinking about harming yourself, or feel you can't keep yourself safe, please reach out now. These services are free and confidential.</p>
    ${crisisLinesHtml()}`;
  return { title: "Crisis help" };
}

function viewAssistant() {
  // Conversation lives only in this closure — leaving the page forgets it.
  let history = [];
  main.innerHTML = `
    ${backLink("/home", "Home")}
    <div class="assistant">
      <div class="assistant__head">
        <h1 tabindex="-1">AI Assistant</h1>
        <button type="button" class="link-quiet" id="clearChat">Clear conversation</button>
      </div>
      <p class="hint">General information only — not medical advice. This chat isn't saved and is cleared when you leave.</p>
      <div class="chat" id="chatLog" role="log" aria-live="polite" aria-label="Conversation"></div>
      <div class="suggestions" id="suggestions">
        ${SUGGESTIONS.map((s) => `<button type="button" class="chip">${esc(s)}</button>`).join("")}
      </div>
      <form class="chat-form" id="chatForm">
        <label for="chatInput" class="sr-only">Your question</label>
        <textarea id="chatInput" rows="1" maxlength="1000" placeholder="Ask a question…"></textarea>
        <button class="btn btn--primary" type="submit">Send</button>
      </form>
    </div>`;

  const log = document.getElementById("chatLog");
  const input = document.getElementById("chatInput");
  const form = document.getElementById("chatForm");
  let busy = false;

  const bubble = (role, html, extraClass = "") => {
    const el = document.createElement("div");
    el.className = `msg msg--${role} ${extraClass}`;
    el.innerHTML = html;
    log.appendChild(el);
    el.scrollIntoView({ block: "end", behavior: reducedMotion ? "auto" : "smooth" });
    return el;
  };
  const textToHtml = (t) => esc(t).split(/\n{2,}/).map((p) => `<p>${p.replace(/\n/g, "<br>")}</p>`).join("");

  const greet = () => {
    log.innerHTML = "";
    bubble("assistant", textToHtml("Hi there. I can answer general questions about caregiving, stress and burnout, finding support, or using this platform. What's on your mind?"));
  };
  greet();

  async function ask(text) {
    if (busy || !text.trim()) return;
    busy = true;
    document.getElementById("suggestions").hidden = true;
    bubble("user", textToHtml(text));
    history.push({ role: "user", content: text });

    // Safety first, and never dependent on the AI responding.
    const crisis = mentionsCrisis(text);
    if (crisis) {
      bubble("assistant", `<p><strong>What you're going through matters, and support is available right now.</strong> Please reach out to one of these services — they're free, confidential, and available 24/7.</p>${crisisLinesHtml()}`, "msg--crisis");
    }

    const typing = bubble("assistant", `<span class="typing" aria-label="Assistant is typing"><span></span><span></span><span></span></span>`);
    let reply = null;
    let offline = false;
    if (CONFIG.assistantEndpoint) {
      try {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 25000);
        const res = await fetch(CONFIG.assistantEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: history.slice(-12) }),
          signal: ctrl.signal,
        });
        clearTimeout(timer);
        if (res.ok) reply = (await res.json()).reply || null;
      } catch {
        /* fall through to offline answer */
      }
    }
    if (!reply) {
      reply = crisis
        ? "I'm not able to give crisis support myself, but the people at these lines are trained for exactly this, and they want to hear from you. If you can, please reach out to one of them now."
        : faqAnswer(text);
      offline = !crisis;
    }
    typing.remove();
    history.push({ role: "assistant", content: reply });
    bubble("assistant", textToHtml(reply) + (offline ? `<p class="msg__note">Built-in answer</p>` : ""));
    busy = false;
  }

  form.onsubmit = (e) => {
    e.preventDefault();
    const text = input.value;
    input.value = "";
    ask(text);
  };
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      form.requestSubmit();
    }
  });
  document.getElementById("suggestions").addEventListener("click", (e) => {
    const chip = e.target.closest(".chip");
    if (chip) ask(chip.textContent);
  });
  document.getElementById("clearChat").onclick = () => {
    history = [];
    greet();
    document.getElementById("suggestions").hidden = false;
    input.focus();
  };
  return { title: "AI Assistant" };
}

/* ---------------- Router ---------------- */

const ROUTES = [
  ["/", viewWelcome, true],
  ["/crisis", viewCrisis, true],
  ["/home", viewHome],
  ["/caregivers", viewConditions],
  ["/caregivers/:cond", viewFormat],
  ["/sim/:cond/:format", viewSim],
  ["/summary", viewSummary],
  ["/survey/:next", viewSurvey],
  ["/resources", viewResources],
  ["/download", viewDownload],
  ["/receivers", viewReceivers],
  ["/assistant", viewAssistant],
];

function match(path) {
  const parts = path.split("/").filter(Boolean);
  for (const [pattern, view, isPublic] of ROUTES) {
    const pp = pattern.split("/").filter(Boolean);
    if (pp.length !== parts.length) continue;
    const params = {};
    if (pp.every((p, i) => (p.startsWith(":") ? ((params[p.slice(1)] = decodeURIComponent(parts[i])), true) : p === parts[i]))) {
      return { view, params, isPublic };
    }
  }
  return null;
}

let current = null;
function route() {
  if (current && current.cleanup) current.cleanup();
  current = null;
  const path = location.hash.replace(/^#/, "") || "/";
  const found = match(path);
  if (!found) return go(auth.currentUser() ? "/home" : "/");
  if (!found.isPublic && !auth.currentUser()) return go("/");

  window.scrollTo(0, 0);
  const result = found.view(found.params);
  if (!result) return; // view redirected
  current = result;
  document.title = `${result.title} · ${CONFIG.platformName}`;
  if (!result.managesFocus) {
    const h1 = main.querySelector("h1");
    if (h1) h1.focus({ preventScroll: true });
  }
}

window.addEventListener("hashchange", route);
// Closed <details> don't print their contents, so open them for the print fallback.
window.addEventListener("beforeprint", () => document.querySelectorAll("details").forEach((d) => (d.open = true)));
renderHeader();
route();
