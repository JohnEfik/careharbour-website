// Deployment settings. Set an endpoint to null to run fully offline.
export const CONFIG = {
  platformName: "CareHarbour",
  // Cloudflare Pages Function in /functions/api/assistant.js. When unreachable,
  // the assistant falls back to built-in answers (data/assistant-faq.js).
  assistantEndpoint: "/api/assistant",
  // Optional: anonymous survey results are also kept on-device.
  surveyEndpoint: "/api/survey",
  // Loaded only when someone downloads a report.
  jsPdfUrl: "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js",
  launchRegion: "CA",
};
