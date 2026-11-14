// Manually curated starter directory, keyed by province/territory.
// Compiled October 2026 from public listings — confirm every phone number and
// link before launch, and re-check quarterly. Swap `lookupResources` for a live
// directory API later without changing the views.
//
// type: "community"   community centres, caregiver organizations, peer support
//       "professional" counsellors, psychologists, health navigation
//       "helpline"    phone/online navigation lines

const NATIONAL = [
  { type: "helpline", name: "211", desc: "Free, confidential help finding local community, social, and health services — including caregiver programs and respite — near your postal code.", phone: "2-1-1", url: "https://211.ca" },
  { type: "community", name: "Canadian Mental Health Association (CMHA)", desc: "Local branches offer peer support, counselling programs, and caregiver workshops.", url: "https://cmha.ca/find-your-cmha/" },
  { type: "community", name: "Alzheimer Society", desc: "Caregiver support groups, education, and respite information through local societies.", url: "https://alzheimer.ca" },
  { type: "community", name: "Canadian Centre for Caregiving Excellence", desc: "Caregiver resources, research, and links to programs across Canada.", url: "https://canadiancaregiving.org" },
  { type: "professional", name: "Find a Canadian Certified Counsellor (CCPA)", desc: "Search certified counsellors and psychotherapists by location.", url: "https://www.ccpa-accp.ca" },
  { type: "helpline", name: "EI caregiving benefits (Service Canada)", desc: "Federal leave and benefits for people caring for a critically ill or injured family member.", url: "https://www.canada.ca/en/services/benefits/ei/caregiving.html" },
];

const PROVINCES = {
  NL: { name: "Newfoundland and Labrador", items: [
    { type: "helpline", name: "811 HealthLine", desc: "24/7 health advice from registered nurses.", phone: "811" },
  ]},
  NS: { name: "Nova Scotia", items: [
    { type: "community", name: "Caregivers Nova Scotia", desc: "Free support groups, workshops, and one-on-one caregiver navigation.", url: "https://caregiversns.org" },
    { type: "professional", name: "Association of Psychologists of Nova Scotia", desc: "Find-a-psychologist referral directory.", url: "https://apns.ca" },
    { type: "helpline", name: "811", desc: "24/7 health advice from registered nurses.", phone: "811" },
  ]},
  PE: { name: "Prince Edward Island", items: [
    { type: "helpline", name: "811", desc: "24/7 health advice from registered nurses.", phone: "811" },
  ]},
  NB: { name: "New Brunswick", items: [
    { type: "helpline", name: "Tele-Care 811", desc: "24/7 health advice from registered nurses.", phone: "811" },
  ]},
  QC: { name: "Québec", items: [
    { type: "helpline", name: "Info-aidant (L'Appui pour les proches aidants)", desc: "Free, confidential listening and referral service for caregivers.", phone: "1-855-852-7784", url: "https://www.lappui.org" },
    { type: "professional", name: "Ordre des psychologues du Québec", desc: "Referral service to find a psychologist.", url: "https://www.ordrepsy.qc.ca" },
    { type: "helpline", name: "Info-Santé / Info-Social 811", desc: "24/7 health and psychosocial advice.", phone: "811" },
  ]},
  ON: { name: "Ontario", items: [
    { type: "helpline", name: "Ontario Caregiver Helpline", desc: "24/7 support and help navigating caregiver services. Run by the Ontario Caregiver Organization.", phone: "1-833-416-2273", url: "https://ontariocaregiver.ca" },
    { type: "community", name: "Ontario Health atHome", desc: "Home and community care, including in-home support and respite services.", phone: "310-2222", url: "https://ontariohealthathome.ca" },
    { type: "professional", name: "Ontario Psychological Association", desc: "Find-a-psychologist referral service.", url: "https://www.psych.on.ca" },
    { type: "helpline", name: "Health811", desc: "24/7 health advice from registered nurses.", phone: "811", url: "https://health811.ontario.ca" },
  ]},
  MB: { name: "Manitoba", items: [
    { type: "community", name: "Alzheimer Society of Manitoba", desc: "Caregiver support groups and education across Manitoba.", url: "https://alzheimer.mb.ca" },
  ]},
  SK: { name: "Saskatchewan", items: [
    { type: "helpline", name: "HealthLine 811", desc: "24/7 health and mental health advice.", phone: "811" },
  ]},
  AB: { name: "Alberta", items: [
    { type: "community", name: "Caregivers Alberta", desc: "Caregiver support programs, peer groups, and workshops.", url: "https://www.caregiversalberta.ca" },
    { type: "professional", name: "Psychologists' Association of Alberta", desc: "Find-a-psychologist directory.", url: "https://psychologistsassociation.ab.ca" },
    { type: "helpline", name: "Health Link 811", desc: "24/7 health advice from registered nurses.", phone: "811" },
  ]},
  BC: { name: "British Columbia", items: [
    { type: "helpline", name: "Family Caregivers of BC Support Line", desc: "Free support and help finding caregiver resources.", phone: "1-877-520-3267", url: "https://www.familycaregiversbc.ca" },
    { type: "professional", name: "BC Psychological Association", desc: "Find-a-psychologist referral directory.", url: "https://www.psychologists.bc.ca" },
    { type: "helpline", name: "HealthLink BC 811", desc: "24/7 health advice from nurses and other professionals.", phone: "811", url: "https://www.healthlinkbc.ca" },
  ]},
  NT: { name: "Northwest Territories / Nunavut", items: [] },
  YT: { name: "Yukon", items: [
    { type: "helpline", name: "HealthLine 811", desc: "24/7 health advice from registered nurses.", phone: "811" },
  ]},
};

// First letter of a Canadian postal code → province/territory
const LETTER_TO_PROVINCE = {
  A: "NL", B: "NS", C: "PE", E: "NB", G: "QC", H: "QC", J: "QC",
  K: "ON", L: "ON", M: "ON", N: "ON", P: "ON",
  R: "MB", S: "SK", T: "AB", V: "BC", X: "NT", Y: "YT",
};

const POSTAL_RE = /^([ABCEGHJ-NPRSTVXY]\d[ABCEGHJ-NPRSTV-Z])\s?(\d[ABCEGHJ-NPRSTV-Z]\d)$/;

// Returns { fsa, formatted, province } or null.
export function parsePostalCode(input) {
  const m = String(input || "").trim().toUpperCase().replace(/-/g, " ").match(POSTAL_RE);
  if (!m) return null;
  return { fsa: m[1], formatted: `${m[1]} ${m[2]}`, province: LETTER_TO_PROVINCE[m[1][0]] };
}

export function lookupResources(postal) {
  const region = PROVINCES[postal.province];
  const items = [...region.items, ...NATIONAL];
  const group = (type) => items.filter((i) => i.type === type);
  return {
    regionName: region.name,
    groups: [
      { id: "community", title: "Community centres & caregiver support", items: group("community") },
      { id: "professional", title: "Professionals & counselling", items: group("professional") },
      { id: "helpline", title: "Helplines & service navigation", items: group("helpline") },
    ],
  };
}
