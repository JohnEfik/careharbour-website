// Branching question engine. Pure functions only — no DOM, no storage — so the
// video and text formats (and tests.html) all drive the exact same logic.

const ID_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ"; // no 0/O/1/I/L confusion

export function generateAnonymousId() {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  const chars = Array.from(bytes, (b) => ID_ALPHABET[b % ID_ALPHABET.length]).join("");
  return `CH-${chars.slice(0, 4)}-${chars.slice(4)}`;
}

function scoreOf(question, answers) {
  const optionId = answers[question.id];
  const option = question.options.find((o) => o.id === optionId);
  return option ? option.score : undefined;
}

function coreComplete(condition, answers) {
  return condition.questions.every((q) => answers[q.id] !== undefined);
}

export function isFollowUpTriggered(condition, answers) {
  const { followUp } = condition;
  if (!followUp || !coreComplete(condition, answers)) return false;
  const t = followUp.trigger;
  if (t.type === "countAtLeast") {
    const hits = condition.questions.filter((q) => scoreOf(q, answers) >= t.minScore).length;
    return hits >= t.count;
  }
  if (t.type === "answerScore") {
    const q = condition.questions.find((x) => x.id === t.question);
    return scoreOf(q, answers) === t.score;
  }
  return false;
}

// The ordered list of questions the user will see, given their answers so far.
// Recomputed on every step, so changing an earlier answer (via Back) can add
// or remove the follow-up.
export function getSequence(condition, answers) {
  const seq = condition.questions.map((q) => ({ ...q, isFollowUp: false }));
  if (isFollowUpTriggered(condition, answers)) {
    seq.push({ ...condition.followUp.question, isFollowUp: true, safety: !!condition.followUp.safety });
  }
  return seq;
}

// Session state: { conditionId, format, anonymousId, answers: {qid: optionId}, cursor }
export function startSession(condition, format) {
  return {
    conditionId: condition.id,
    format,
    anonymousId: generateAnonymousId(),
    answers: {},
    cursor: 0,
    startedAt: new Date().toISOString(),
  };
}

export function getStep(condition, session) {
  const seq = getSequence(condition, session.answers);
  if (session.cursor >= seq.length) return { type: "complete" };
  const question = seq[session.cursor];
  return {
    type: "question",
    question,
    index: session.cursor,
    // The follow-up may not be known yet, so show the core count until it appears.
    total: seq.length,
    selected: session.answers[question.id],
  };
}

export function answer(condition, session, optionId) {
  const step = getStep(condition, session);
  if (step.type !== "question") return session;
  if (!step.question.options.some((o) => o.id === optionId)) throw new Error(`Unknown option ${optionId}`);
  const answers = { ...session.answers, [step.question.id]: optionId };
  return { ...session, answers, cursor: session.cursor + 1 };
}

export function back(session) {
  return { ...session, cursor: Math.max(0, session.cursor - 1) };
}

export function buildReport(condition, session) {
  const { answers } = session;
  const followUpActive = isFollowUpTriggered(condition, answers);
  const seq = getSequence(condition, answers);

  const answered = seq
    .filter((q) => answers[q.id] !== undefined)
    .map((q) => {
      const opt = q.options.find((o) => o.id === answers[q.id]);
      return { id: q.id, question: q.text, answer: opt.text, letter: opt.id, score: opt.score, isFollowUp: q.isFollowUp };
    });

  const score = answered.filter((a) => !a.isFollowUp).reduce((sum, a) => sum + a.score, 0);
  const band = condition.bands.find((b) => score >= b.min && score <= b.max);

  const followUpOption =
    followUpActive && condition.followUp.question.options.find((o) => o.id === answers[condition.followUp.question.id]);
  const crisis = !!(followUpOption && followUpOption.crisis);

  const extraTips = condition.conditionalTips
    .filter((t) => {
      if (!followUpActive || t.when.question !== condition.followUp.question.id) return false;
      return followUpOption && followUpOption.score >= t.when.minScore;
    })
    .map((t) => t.text);

  return {
    anonymousId: session.anonymousId,
    conditionId: condition.id,
    conditionTitle: condition.title,
    format: session.format,
    completedAt: new Date().toISOString(),
    score,
    maxScore: condition.maxScore,
    band: { id: band.id, label: band.label, framing: band.framing },
    tips: [...band.tips, ...extraTips],
    answers: answered,
    followUpTriggered: followUpActive,
    crisis,
    crisisFraming: crisis ? condition.crisisFraming : null,
  };
}
