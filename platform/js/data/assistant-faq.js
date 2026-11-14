// Offline answers for the AI Assistant. Used when the live endpoint isn't
// configured or can't be reached, so the assistant always says something useful.

// Checked on every message before anything is sent anywhere. A match shows the
// hard-coded crisis card immediately, independent of any AI response.
const CRISIS_PATTERNS = [
  /\bsuicid/i, /\bkill (my ?self|me)\b/i, /\bend (my|it all|my life)\b/i, /\bself[- ]?harm/i,
  /\bhurt(ing)? (my ?self)\b/i, /\bwant(ed)? to die\b/i, /\bbetter off dead\b/i,
  /\b(life|living) (isn'?t|is not|isnt) worth\b/i, /\bno reason to live\b/i, /\boverdose\b/i,
];

export function mentionsCrisis(text) {
  return CRISIS_PATTERNS.some((re) => re.test(text));
}

const FAQ = [
  {
    keys: ["burnout", "exhausted", "drained", "empty", "tired all the time"],
    answer: "Caregiver burnout is a state of ongoing physical, emotional, and mental exhaustion that can build when caregiving demands outpace the rest and support you get. Common signs include low energy, trouble sleeping, irritability or numbness, and losing the sense of meaning in the role. It's common, and it's manageable with attention — small daily breaks, sharing tasks, and respite care can help. The Burnout simulation (For Caregivers → Burnout) can help you reflect on where you are.",
  },
  {
    keys: ["work", "job", "employer", "boss", "manager", "leave", "flexible"],
    answer: "Balancing a job with caregiving is one of the most common sources of strain. Practical steps: check your workplace's policies for flexible hours, remote days, or caregiver leave; ask whether there's an Employee and Family Assistance Program (EFAP); and consider telling one trusted manager or coworker before things get harder. In Canada, Employment Insurance caregiving benefits may also apply — see canada.ca. The Work Stress simulation can help you see where the pressure points are.",
  },
  {
    keys: ["respite", "break", "time off", "relief", "someone else"],
    answer: "Respite care gives you a short break while someone else provides care — a few hours a week, a day program, or a short overnight stay. Options vary by region; 211 (call 2-1-1 or visit 211.ca) can point you to local respite programs, and provincial caregiver organizations often keep lists too. After a simulation, choose \"Yes\" to connecting with community resources to see options near your postal code.",
  },
  {
    keys: ["sleep", "insomnia", "night"],
    answer: "Disrupted sleep is very common for caregivers. Some general ideas: keep a consistent wind-down routine, share night-time duties if anyone can help, and nap when the person you care for rests if possible. If poor sleep is regular or affecting your health, it's worth mentioning to a doctor. A dedicated Sleep Disruption simulation is coming in a later update.",
  },
  {
    keys: ["guilt", "guilty", "resent", "angry", "irritable", "impatient"],
    answer: "Feelings like guilt, resentment, or irritability are a very normal part of caregiving, especially when you're stretched thin. They're usually a sign of exhaustion, not a reflection of how much you care. Naming the feeling to yourself without judgment, and talking to someone you trust, can take some of its weight away.",
  },
  {
    keys: ["simulation", "video", "text", "avatar", "how does", "how do i", "start"],
    answer: "From the home screen, choose For Caregivers, pick a condition (Work Stress or Burnout), then choose Video or Text. Both ask the same questions — Video has a guide who reads them aloud, Text is plain and quick. You can go back and change any answer. At the end you get a summary with general self-management tips.",
  },
  {
    keys: ["privacy", "anonymous", "data", "id", "personal", "name"],
    answer: "Your summary report is labelled with a random anonymous ID — not your name or email. Your answers aren't attached to your account. If you share your postal code, it's only used to look up nearby resources. This assistant doesn't remember past conversations.",
  },
  {
    keys: ["pdf", "download", "save", "report", "print"],
    answer: "At the end of a simulation, after the short survey, you can download your summary as a PDF. It includes your answers and the suggested tips, labelled with your anonymous ID only.",
  },
  {
    keys: ["resource", "near me", "postal", "community", "counsellor", "counselor", "therapist", "support group", "help near"],
    answer: "After you finish a simulation, answer \"Yes\" to connecting with community resources and enter your postal code — you'll see caregiver organizations, counselling directories, and helplines for your region. You can also call 2-1-1 any time for local services.",
  },
  {
    keys: ["care receiver", "receiver", "person i care for"],
    answer: "The Care Receivers section is coming in a later update. For now, the platform focuses on support for caregivers.",
  },
];

const FALLBACK =
  "I'm not sure I have a good answer to that one. I can help with general questions about caregiver stress, burnout, respite, balancing work and care, and how to use this platform. For anything medical, please check with a healthcare provider.";

export function faqAnswer(text) {
  const q = text.toLowerCase();
  let best = null;
  let bestHits = 0;
  for (const entry of FAQ) {
    const hits = entry.keys.filter((k) => q.includes(k)).length;
    if (hits > bestHits) {
      best = entry;
      bestHits = hits;
    }
  }
  return best ? best.answer : FALLBACK;
}

export const SUGGESTIONS = [
  "What is caregiver burnout?",
  "How do I talk to my employer about caregiving?",
  "What is respite care?",
  "Is my report anonymous?",
];
