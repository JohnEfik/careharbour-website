// Small shared UI helpers: escaping, crisis rendering, report rendering.

import { CRISIS, telHref, smsHref } from "./data/crisis.js";
import { DISCLAIMER } from "./pdf.js";

export const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

export const icon = {
  phone: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z"/></svg>`,
  chat: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z"/></svg>`,
  link: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14 21 3"/></svg>`,
  heart: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 1 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z"/></svg>`,
  person: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="7" r="4"/><path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1"/></svg>`,
  spark: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/><circle cx="12" cy="12" r="3"/></svg>`,
  video: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m23 7-7 5 7 5V7Z"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>`,
  text: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h10"/></svg>`,
  back: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg>`,
  arrow: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>`,
};

function crisisLine(line) {
  const actions = [
    line.call && `<a class="btn btn--crisis btn--sm" href="${telHref(line.call)}">${icon.phone}<span>Call ${esc(line.call)}</span></a>`,
    line.text && `<a class="btn btn--ghost btn--sm" href="${smsHref(line.text)}">${icon.chat}<span>${esc(line.textNote || `Text ${line.text}`)}</span></a>`,
    line.url && `<a class="btn btn--ghost btn--sm" href="${esc(line.url)}" target="_blank" rel="noopener">${icon.link}<span>Website<span class="sr-only"> (opens in a new tab)</span></span></a>`,
  ].filter(Boolean);
  return `<li class="crisis-line">
    <p class="crisis-line__name">${esc(line.name)}</p>
    <p class="crisis-line__detail">${esc(line.detail)}</p>
    ${actions.length ? `<div class="crisis-line__actions">${actions.join("")}</div>` : ""}
  </li>`;
}

// Canada first (launch region), other regions behind a disclosure.
export function crisisLinesHtml() {
  return `
    <ul class="crisis-lines">${CRISIS.CA.lines.map(crisisLine).join("")}</ul>
    <details class="crisis-more">
      <summary>Not in Canada?</summary>
      <h3 class="crisis-region">${esc(CRISIS.US.label)}</h3>
      <ul class="crisis-lines">${CRISIS.US.lines.map(crisisLine).join("")}</ul>
      <h3 class="crisis-region">${esc(CRISIS.INTL.label)}</h3>
      <ul class="crisis-lines">${CRISIS.INTL.lines.map(crisisLine).join("")}</ul>
    </details>`;
}

export function disclaimerHtml() {
  return `<aside class="disclaimer" aria-label="Disclaimer">${esc(DISCLAIMER)}</aside>`;
}

export function formatDate(iso) {
  return new Date(iso).toLocaleDateString("en-CA", { year: "numeric", month: "long", day: "numeric" });
}

// The report body, shared by the summary screen and the print fallback.
export function reportHtml(report, { headingLevel = 2 } = {}) {
  const h = `h${headingLevel}`;
  const tips = `<ul class="tips">${report.tips.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>`;
  const answers = `<ol class="answers">${report.answers
    .map(
      (a) => `<li${a.isFollowUp ? ' class="answers__followup"' : ""}>
        <p class="answers__q">${a.isFollowUp ? "<span class=\"tag\">Follow-up</span> " : ""}${esc(a.question)}</p>
        <p class="answers__a">${esc(a.answer)}</p>
      </li>`
    )
    .join("")}</ol>`;

  return `
    ${report.crisis ? `
      <section class="crisis-panel" aria-labelledby="crisisLead">
        <${h} id="crisisLead">${esc(report.crisisFraming)}</${h}>
        <p class="crisis-panel__lead">Please reach out to a crisis line or a professional now. You don't have to wait, and you don't have to explain everything — just say you need to talk to someone.</p>
        ${crisisLinesHtml()}
      </section>` : ""}

    <div class="report-meta">
      <span>Anonymous ID <strong>${esc(report.anonymousId)}</strong></span>
      <span>${esc(formatDate(report.completedAt))}</span>
    </div>
    ${disclaimerHtml()}

    <section class="card band band--${esc(report.band.id)}" aria-labelledby="bandHeading">
      <p class="eyebrow">${esc(report.conditionTitle)}</p>
      <${h} id="bandHeading">${esc(report.band.label)}</${h}>
      <p class="band__framing">${esc(report.band.framing)}</p>
      <p class="band__score">Score ${report.score} of ${report.maxScore}</p>
    </section>

    ${report.crisis ? `
      <details class="card card--quiet">
        <summary>When you're ready: general self-care suggestions</summary>
        ${tips}
      </details>` : `
      <section class="card" aria-labelledby="tipsHeading">
        <${h} id="tipsHeading">Suggestions you might try</${h}>
        ${tips}
      </section>`}

    <details class="card card--quiet">
      <summary>Your answers</summary>
      ${answers}
    </details>`;
}
