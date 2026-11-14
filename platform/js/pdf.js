// PDF export of the summary report. jsPDF is loaded on demand; if it can't load
// (offline, blocked CDN) we fall back to the browser's print dialog, which can
// also save as PDF.

import { CONFIG } from "./config.js";
import { CRISIS } from "./data/crisis.js";

export const DISCLAIMER =
  "This is general, non-clinical guidance. It is not a medical diagnosis or treatment plan. Please consult a healthcare provider about any clinical concerns.";

let loading = null;
function loadJsPdf() {
  if (window.jspdf) return Promise.resolve(window.jspdf.jsPDF);
  loading ||= new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = CONFIG.jsPdfUrl;
    s.onload = () => (window.jspdf ? resolve(window.jspdf.jsPDF) : reject(new Error("jsPDF missing")));
    s.onerror = () => {
      loading = null;
      reject(new Error("Could not load jsPDF"));
    };
    document.head.appendChild(s);
  });
  return loading;
}

// Standard PDF fonts only cover basic Latin, so swap typographic punctuation.
const plain = (s) =>
  s.replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/—/g, " - ").replace(/–/g, "-").replace(/ /g, " ");

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("en-CA", { year: "numeric", month: "long", day: "numeric" });
}

export async function downloadReportPdf(report) {
  let JsPDF;
  try {
    JsPDF = await loadJsPdf();
  } catch {
    window.print();
    return "print";
  }

  const doc = new JsPDF({ unit: "pt", format: "letter" });
  const margin = 56;
  const width = doc.internal.pageSize.getWidth() - margin * 2;
  const pageBottom = doc.internal.pageSize.getHeight() - margin;
  let y = margin;

  const ensure = (h) => {
    if (y + h > pageBottom) {
      doc.addPage();
      y = margin;
    }
  };
  const text = (str, { size = 11, bold = false, color = [22, 48, 47], gap = 6, indent = 0 } = {}) => {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(size);
    doc.setTextColor(...color);
    const lines = doc.splitTextToSize(plain(str), width - indent);
    const lh = size * 1.35;
    for (const line of lines) {
      ensure(lh);
      doc.text(line, margin + indent, y + size);
      y += lh;
    }
    y += gap;
  };
  const heading = (str) => {
    y += 8;
    text(str, { size: 14, bold: true, color: [14, 71, 73], gap: 4 });
  };
  const bullet = (str) => {
    ensure(16);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text("-", margin + 4, y + 11);
    text(str, { indent: 16, gap: 4 });
  };

  text("CareHarbour", { size: 12, bold: true, color: [20, 107, 107], gap: 2 });
  text(`${report.conditionTitle} - Summary Report`, { size: 20, bold: true, color: [14, 71, 73], gap: 4 });
  text(`Anonymous ID: ${report.anonymousId}    Date: ${formatDate(report.completedAt)}`, { size: 10, color: [77, 99, 95], gap: 10 });

  text(DISCLAIMER, { size: 10, color: [77, 99, 95], gap: 8 });

  if (report.crisis) {
    heading(report.crisisFraming);
    text("Please reach out to a crisis line or professional now. You don't have to wait.", { bold: true });
    for (const line of CRISIS.CA.lines) {
      const how = [line.call && `Call ${line.call}`, line.textNote || (line.text && `Text ${line.text}`), line.url].filter(Boolean).join("  |  ");
      bullet(`${line.name}${how ? ": " + how : ""}`);
    }
    text("Outside Canada: in the US call or text 988. Elsewhere, visit findahelpline.com.", { size: 10, gap: 8 });
  }

  heading(`Where you are: ${report.band.label}`);
  text(report.band.framing);
  text(`Score: ${report.score} of ${report.maxScore}`, { size: 10, color: [77, 99, 95] });

  heading(report.crisis ? "When you're ready: general self-care suggestions" : "Suggestions you might try");
  report.tips.forEach(bullet);

  heading("Your answers");
  report.answers.forEach((a, i) => {
    ensure(40);
    text(`${a.isFollowUp ? "Follow-up" : `Q${i + 1}`}. ${a.question}`, { bold: true, gap: 2 });
    text(a.answer, { indent: 16, gap: 8 });
  });

  y += 6;
  text(DISCLAIMER, { size: 9, color: [77, 99, 95] });

  doc.save(`CareHarbour-${report.conditionId}-${report.anonymousId}.pdf`);
  return "pdf";
}
