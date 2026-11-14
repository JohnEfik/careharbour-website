// Single source of truth for every simulation. The video and text formats both
// read from here through engine.js, so content and branching never drift apart.
//
// Shape of a condition:
//   questions        6 core questions, each option scored 0–3
//   followUp         one extra question, shown only when `trigger` matches.
//                    Its answer never changes the score or band.
//   bands            score ranges (inclusive) → framing + tips
//   conditionalTips  extra tips added when a follow-up answer meets `minScore`
//   crisisFraming    shown first when a follow-up option has `crisis: true`

const scale = (a, b, c, d) => [
  { id: "A", text: a, score: 0 },
  { id: "B", text: b, score: 1 },
  { id: "C", text: c, score: 2 },
  { id: "D", text: d, score: 3 },
];

export const CONDITIONS = [
  {
    id: "work-stress",
    title: "Work Stress",
    status: "available",
    blurb: "For caregivers balancing paid employment with caregiving responsibilities.",
    maxScore: 18,
    questions: [
      {
        id: "q1",
        text: "How often do you feel distracted by caregiving concerns while you're at work?",
        options: scale(
          "Rarely or never",
          "Sometimes, but I can usually refocus",
          "Often — it's hard to concentrate",
          "Constantly — I can barely function at work"
        ),
      },
      {
        id: "q2",
        text: "How manageable is your current workload alongside your caregiving duties?",
        options: scale(
          "Very manageable — I have enough time for both",
          "Mostly manageable, with occasional strain",
          "Difficult most weeks",
          "Overwhelming — something is always falling through the cracks"
        ),
      },
      {
        id: "q3",
        text: "Have you had to miss work, arrive late, or leave early because of caregiving in the last month?",
        options: scale("No", "Once or twice", "Several times", "Regularly — it's become a pattern"),
      },
      {
        id: "q4",
        text: "Do you feel supported by your employer or workplace when caregiving demands come up?",
        options: scale(
          "Yes, fully supported",
          "Somewhat, but I don't always feel comfortable asking",
          "Not really — I keep it to myself",
          "No — I actively hide it out of fear of consequences"
        ),
      },
      {
        id: "q5",
        text: "How is work-related stress affecting your physical health? (headaches, fatigue, tension, sleep)",
        options: scale(
          "Not noticeably",
          "Mild symptoms occasionally",
          "Regular symptoms, most weeks",
          "Significant symptoms, most days"
        ),
      },
      {
        id: "q6",
        text: "When you think about the coming month, how do you feel about keeping up this balance?",
        options: scale("Confident", "Cautiously okay", "Worried", "Like something has to give"),
      },
    ],
    followUp: {
      // C or D (score 2+) on three or more core questions
      trigger: { type: "countAtLeast", minScore: 2, count: 3 },
      question: {
        id: "fu",
        text: "Has this level of work stress affected your relationships with coworkers, your manager, or your family at home?",
        options: scale(
          "No noticeable effect",
          "A little tension here and there",
          "Yes, it's causing real strain",
          "Yes, significantly — in more than one relationship"
        ),
      },
    },
    bands: [
      {
        id: "low",
        min: 0,
        max: 6,
        label: "Low strain",
        framing: "Your work stress currently seems manageable, though it's worth staying aware of it.",
        tips: [
          "Keep doing what's working — small routines for separating work and caregiving time are paying off.",
          "Build in a regular check-in with yourself, weekly or monthly, to catch early signs of strain before they build up.",
          "Consider looping in a trusted coworker or manager now, before you need the support, so the relationship is already there if things get harder.",
        ],
      },
      {
        id: "moderate",
        min: 7,
        max: 12,
        label: "Moderate strain",
        framing: "You're carrying real strain between work and caregiving right now, and it's starting to show.",
        tips: [
          "Look at whether your workplace has flexible scheduling, remote work days, or leave policies (like caregiver leave) you haven't used yet.",
          "Try writing down the specific moments each week where work and caregiving collide hardest. Patterns often point to one or two fixable pressure points, rather than the whole week being unmanageable.",
          "Talk to one person — a coworker, friend, or family member — about what's going on. Carrying it alone tends to make it heavier than it is.",
        ],
      },
      {
        id: "high",
        min: 13,
        max: 18,
        label: "High strain",
        framing: "What you're describing is a significant, sustained level of stress, and it's affecting your work, your health, or both.",
        tips: [
          "This is a good point to have a direct conversation with your employer about accommodations, even if it feels uncomfortable. Many workplaces have more flexibility than people assume — but only if they know.",
          "Physical symptoms showing up regularly (headaches, poor sleep, fatigue) are worth mentioning to a doctor, not just managing on your own.",
          "Consider whether any part of the caregiving load can be shared, even temporarily, with another family member, a paid service, or a community resource. You don't have to carry all of it to keep your job.",
        ],
      },
    ],
    conditionalTips: [
      {
        when: { question: "fu", minScore: 2 },
        text: "Strain that's spilling into your relationships is a signal worth taking seriously on its own, not just as a side effect of work stress. It may help to name what's happening directly with the people involved, rather than letting it go unspoken.",
      },
    ],
  },

  {
    id: "burnout",
    title: "Burnout",
    status: "available",
    blurb: "For caregivers experiencing sustained emotional, physical, or mental exhaustion from the caregiving role itself.",
    maxScore: 18,
    questions: [
      {
        id: "q1",
        text: "How would you describe your energy level on a typical day recently?",
        options: scale(
          "Normal — I feel like myself",
          "Lower than usual, but functional",
          "Frequently drained — I'm running on empty most days",
          "Completely depleted — I have nothing left by midday"
        ),
      },
      {
        id: "q2",
        text: "Do you still feel a sense of purpose or meaning in your caregiving role?",
        options: scale(
          "Yes, consistently",
          "Mostly, though it's harder some days",
          "Rarely — it feels more like an obligation now",
          "No — it feels empty or resentful most of the time"
        ),
      },
      {
        id: "q3",
        text: "How often do you feel irritable, impatient, or emotionally numb toward the person you're caring for?",
        options: scale("Rarely or never", "Occasionally", "Fairly often", "Almost constantly"),
      },
      {
        id: "q4",
        text: "When did you last have real time to yourself, unrelated to caregiving or other obligations?",
        options: scale(
          "Within the last few days",
          "Within the last couple of weeks",
          "It's been over a month",
          "I honestly can't remember"
        ),
      },
      {
        id: "q5",
        text: "How is this role affecting your sleep?",
        options: scale(
          "Sleeping normally",
          "Occasionally disrupted",
          "Regularly disrupted or unrefreshing",
          "Severely disrupted, most nights"
        ),
      },
      {
        id: "q6",
        text: "Have you had thoughts of wanting to give up or walk away from the caregiving role entirely, even briefly?",
        options: scale(
          "No",
          "Fleetingly, then it passes",
          "Yes, more than once",
          "Yes, frequently, and it's weighing on me"
        ),
      },
    ],
    followUp: {
      // Safety check: D (score 3) on Q6, regardless of overall score
      trigger: { type: "answerScore", question: "q6", score: 3 },
      safety: true,
      question: {
        id: "fu",
        text: "Beyond wanting to step back from caregiving, have you had thoughts of harming yourself or that life isn't worth living?",
        options: [
          { id: "A", text: "No, not at all", score: 0 },
          { id: "B", text: "Yes, I need to talk to someone", score: null, crisis: true },
        ],
      },
    },
    crisisFraming: "What you've shared matters, and support is available right now.",
    bands: [
      {
        id: "early",
        min: 0,
        max: 6,
        label: "Early signs",
        framing: "You're showing some early signs of burnout — worth paying attention to before they build.",
        tips: [
          "Protect small windows of personal time now, even 15 to 20 minutes a day, rather than waiting until you're depleted to prioritize it.",
          "Notice which specific tasks drain you most versus which ones still feel okay. This can help you spot where support is actually needed first.",
          "Staying connected to at least one person outside the caregiving role, just to talk, tends to slow burnout down significantly.",
        ],
      },
      {
        id: "moderate",
        min: 7,
        max: 12,
        label: "Moderate burnout",
        framing: "What you're describing points to real, ongoing burnout. This is common, and it's manageable — but it needs attention.",
        tips: [
          "Respite care, even a few hours a week, isn't a luxury at this stage — it's a practical tool. It's worth looking into local options.",
          "If irritability or numbness toward the person you're caring for is showing up, that's exhaustion talking, not a reflection of you as a caregiver. It's worth naming that to yourself without guilt.",
          "Consider whether any tasks can be delegated, shared with another family member, or outsourced, even temporarily, to create breathing room.",
        ],
      },
      {
        id: "severe",
        min: 13,
        max: 18,
        label: "Severe burnout",
        framing: "This level of exhaustion is significant, and it's affecting your wellbeing in ways that matter. Please treat this seriously.",
        tips: [
          "Talk to a doctor or counsellor about what you're experiencing. Severe burnout has real physical and mental health effects, and support exists beyond what this platform can offer.",
          "Look into respite care or temporary relief options as soon as possible. Even a short break can matter at this level.",
          "You don't have to carry this alone, and asking for help isn't a failure. Connecting with a support group or community resource is a strong next step.",
        ],
      },
    ],
    conditionalTips: [],
  },

  // Later phase — same template as above. Listed so users can see what's coming.
  { id: "compassion-fatigue", title: "Compassion Fatigue", status: "coming-soon", blurb: "When caring for others leaves little emotional energy for yourself." },
  { id: "isolation", title: "Isolation", status: "coming-soon", blurb: "Feeling cut off from friends, community, or life outside caregiving." },
  { id: "sleep-disruption", title: "Sleep Disruption", status: "coming-soon", blurb: "When night-time care or worry is costing you rest." },
  { id: "financial-strain", title: "Financial Strain", status: "coming-soon", blurb: "The cost of caregiving on income, savings, and work." },
];

export function getCondition(id) {
  return CONDITIONS.find((c) => c.id === id && c.status === "available") || null;
}
