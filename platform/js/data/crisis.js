// Hard-coded crisis resources. Rendered straight from this file — never from AI
// output — so they appear even if the assistant or network is down.
// Keep in sync with ../../crisis.html (the no-JavaScript fallback page).

export const CRISIS = {
  CA: {
    label: "Canada",
    lines: [
      { name: "Emergency services", detail: "If you or someone else is in immediate danger.", call: "911" },
      { name: "9-8-8 Suicide Crisis Helpline", detail: "Free, 24/7, in English and French.", call: "988", text: "988", url: "https://988.ca" },
      { name: "Hope for Wellness Help Line", detail: "For all Indigenous peoples across Canada. 24/7, phone or online chat.", call: "1-855-242-3310", url: "https://www.hopeforwellness.ca" },
      { name: "Kids Help Phone", detail: "For young people, including young caregivers. 24/7.", call: "1-800-668-6868", text: "686868", textNote: "Text CONNECT to 686868", url: "https://kidshelpphone.ca" },
      { name: "Québec: 1-866-APPELLE", detail: "Suicide prevention line for Québec residents.", call: "1-866-277-3553" },
    ],
  },
  US: {
    label: "United States",
    lines: [
      { name: "Emergency services", detail: "If you or someone else is in immediate danger.", call: "911" },
      { name: "988 Suicide & Crisis Lifeline", detail: "Free, 24/7, call or text.", call: "988", text: "988", url: "https://988lifeline.org" },
      { name: "Crisis Text Line", detail: "Text with a trained volunteer, 24/7.", text: "741741", textNote: "Text HOME to 741741" },
    ],
  },
  INTL: {
    label: "Elsewhere",
    lines: [
      { name: "Find a Helpline", detail: "Free directory of crisis lines in many countries.", url: "https://findahelpline.com" },
      { name: "Local emergency number", detail: "If you're in immediate danger, call your local emergency number." },
    ],
  },
};

export const telHref = (num) => `tel:${num.replace(/[^\d+]/g, "")}`;
export const smsHref = (num) => `sms:${num.replace(/[^\d+]/g, "")}`;
