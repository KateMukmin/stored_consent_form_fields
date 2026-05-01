module.exports = function handler(req, res) {
  const fs = require('fs');
  const path = require('path');

  // Handle passcode POST
  if (req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      try {
        const { passcode } = JSON.parse(body);
        if (passcode === process.env.PASSCODE) {
          res.setHeader('Set-Cookie', 'auth=granted; HttpOnly; Path=/; Max-Age=28800; SameSite=Strict');
          res.status(200).json({ success: true });
        } else {
          res.status(401).json({ error: 'Incorrect passcode' });
        }
      } catch (e) {
        res.status(400).json({ error: 'Bad request' });
      }
    });
    return;
  }

  // Check cookie
  const cookies = req.headers.cookie || '';
  const isAuthed = cookies.split(';').some(c => c.trim() === 'auth=granted');

  res.setHeader('Content-Type', 'text/html');

  if (isAuthed) {
    res.status(200).send(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>FCA — Worker Profile Fields</title>
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600&display=swap" rel="stylesheet"/>
<script src="https://unpkg.com/react@18/umd/react.production.min.js" crossorigin><\/script>
<script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js" crossorigin><\/script>
<script src="https://unpkg.com/@babel/standalone/babel.min.js"><\/script>
<style>
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: 'Poppins', sans-serif; background: #fff; }
</style>
</head>
<body>
<div id="root"></div>
<script type="text/babel">
const { useState, useRef } = React;


/* ═══════════════════════ DATA ═══════════════════════ */
const SKIP_OPTS = ["Not Set", "Until Consent Form", "Until Badge Printing", "Until Badge Activation"];

const INIT_PROFILE = [
  { name: "General", fields: [
    { n: "Ethnicity", t: "Select", v: false, m: false, sk: false, st: false, su: "Not Set" },
    { n: "Gender", t: "Select", v: false, m: false, sk: false, st: false, su: "Not Set" },
    { n: "Primary Language", t: "Select", v: false, m: false, sk: false, st: false, su: "Not Set" },
    { n: "Are you a veteran?", t: "Select", v: false, m: false, sk: false, st: false, su: "Not Set" },
    { n: "Photo", t: "Image", v: true, m: true, sk: false, st: false, su: "Not Set", locked: true },
    { n: "Employer", t: "Select", v: true, m: true, sk: false, st: false, su: "Not Set", locked: true, noSkip: true },
    { n: "First Name", t: "Text Field", v: true, m: true, sk: false, st: false, su: "Not Set", locked: true, noSkip: true },
    { n: "Middle Name", t: "Text Field", v: false, m: false, sk: false, st: false, su: "Not Set", noSkip: true, noMand: true },
    { n: "Last Name", t: "Text Field", v: true, m: true, sk: false, st: false, su: "Not Set", locked: true, noSkip: true },
    { n: "Allergies", t: "Text Field", v: false, m: false, sk: false, st: false, su: "Not Set", noSkip: true, noMand: true },
    { n: "Date of Birth", t: "Date Picker", v: false, m: false, sk: false, st: false, su: "Not Set", noSkip: true, pii: true },
    { n: "Last SSN", t: "Text Field", v: false, m: false, sk: false, st: false, su: "Not Set", pii: true },
  ] },
  { name: "Trades", fields: [
    { n: "Role", t: "Select", v: false, m: false, sk: false, st: false, su: "Not Set" },
    { n: "Labor Union", t: "Select", v: false, m: false, sk: false, st: false, su: "Not Set" },
    { n: "Trades", t: "Select", v: false, m: false, sk: false, st: false, su: "Not Set" },
    { n: "Work Experience", t: "Select", v: false, m: false, sk: false, st: false, su: "Not Set" },
    { n: "Labor Union Number", t: "Text Field", v: false, m: false, sk: false, st: false, su: "Not Set", noSkip: true },
  ] },
  { name: "Contact Information", fields: [
    { n: "Alternate Phone", t: "Phone Number", v: false, m: false, sk: false, st: false, su: "Not Set" },
    { n: "Email", t: "Text Field", v: false, m: false, sk: false, st: false, su: "Not Set", noSkip: true },
    { n: "Mobile Phone", t: "Phone Number", v: false, m: false, sk: false, st: false, su: "Not Set", noSkip: true },
    { n: "Email Or Mobile Phone", t: "Text / Phone", v: false, m: false, sk: false, st: false, su: "Not Set", noSkip: true },
  ] },
  { name: "Home Address", fields: [
    { n: "Address Line 1", t: "Text Field", v: false, m: false, sk: false, st: false, su: "Not Set", pii: true },
    { n: "Address Line 2", t: "Text Field", v: false, m: false, sk: false, st: false, su: "Not Set", pii: true, noSkip: true, noMand: true },
    { n: "Country", t: "Text Field", v: false, m: false, sk: false, st: false, su: "Not Set", pii: true },
    { n: "State/Province/Territory", t: "Text Field", v: false, m: false, sk: false, st: false, su: "Not Set", pii: true },
    { n: "City", t: "Text Field", v: false, m: false, sk: false, st: false, su: "Not Set", pii: true },
    { n: "Zip Code", t: "Text Field", v: false, m: false, sk: false, st: false, su: "Not Set", pii: true },
  ] },
  { name: "Emergency Contact", fields: [
    { n: "Emergency Contact Name", t: "Text Field", v: false, m: false, sk: false, st: false, su: "Not Set" },
    { n: "Emergency Contact Relationship", t: "Text Field", v: false, m: false, sk: false, st: false, su: "Not Set" },
    { n: "Emergency Contact Mobile Phone", t: "Phone Number", v: false, m: false, sk: false, st: false, su: "Not Set" },
  ] },
  { name: "Government Issued ID", fields: [
    { n: "ID Type", t: "Text Field", v: false, m: false, sk: false, st: false, su: "Not Set" },
    { n: "Issued By", t: "Text Field", v: false, m: false, sk: false, st: false, su: "Not Set" },
    { n: "ID Number", t: "Text Field", v: false, m: false, sk: false, st: false, su: "Not Set" },
    { n: "ID Image", t: "Image", v: false, m: false, sk: false, st: false, su: "Not Set" },
  ] },
];

const INIT_STANDARD = [
  { n: "Job Title", t: "Select (Inspector, Laborer, Lead, Office Staff / Administrative Support and 9 more)", v: false, m: false },
  { n: "Project Trade", t: "Select (Acoustical Treatment, Audio Visual, Carpenter, Concrete and 28 more)", v: false, m: false },
  { n: "Trade Status", t: "Select (Apprentice, Foreman, Journeyman, Master and 1 more)", v: false, m: false },
  { n: "Last 4 SSN", t: "Text Field (4 Digits - 0000)", v: false, m: false },
  { n: "Supervisor Name", t: "Text Field", v: false, m: false },
  { n: "Supervisor Phone", t: "Phone number", v: false, m: false },
  { n: "Section 3 Employee", t: "Select (No, Yes)", v: false, m: false },
  { n: "Section 3 Resident", t: "Select (No, Yes)", v: false, m: false },
  { n: "Date of Hire", t: "Date Picker", v: false, m: false },
  { n: "Eligible To Work In Us", t: "Select (No, Yes)", v: false, m: false },
  { n: "Years of Experience", t: "Select (Less than 1 year [0-1], More than 2 years [2-7], More than 8 years [8-13], More than 14 years [14-19] and 1 more)", v: false, m: false },
  { n: "Hourly / Salary", t: "Select (Hourly, Salary)", v: false, m: false },
  { n: "Hourly Rate of Pay", t: "Text Field (Money - 000.00)", v: false, m: false },
  { n: "LGBTQ", t: "Select (No, Yes)", v: false, m: false },
  { n: "Hard Hat Number", t: "Text Field", v: false, m: false },
  { n: "Referred by Building Skills NY", t: "Select (No, Yes)", v: false, m: false },
  { n: "Listed on NYCHA Lease", t: "Select (No, Yes)", v: false, m: false },
];

const INIT_CUSTOM = [
  { n: "Blah", t: "Text Field", v: false, m: false },
  { n: "Date Test", t: "Date Picker", v: false, m: false },
  { n: "Test Select", t: "Select (Value 1, Value 2)", v: false, m: false },
];

/* ═══════════════════════ UTILS ═══════════════════════ */
function clone(o) { return JSON.parse(JSON.stringify(o)); }

function applyRules(f) {
  if (!f.v) { f.m = false; f.sk = false; f.st = false; f.su = "Not Set"; }
  if (!f.m) { f.sk = false; f.st = false; f.su = "Not Set"; }
  if (f.st) { f.sk = false; f.su = "Not Set"; }
  if (f.sk) { f.st = false; }
  if (!f.sk) { f.su = "Not Set"; }
}

/* ═══════════════════════ STYLES ═══════════════════════ */

/* Custom checkbox component - reliable in artifact env */
function Cb({ checked, disabled, onChange }) {
  return (
    <div
      onClick={() => { if (!disabled && onChange) onChange(!checked); }}
      style={{
        width: 18, height: 18, borderRadius: 3,
        border: checked ? "none" : "2px solid " + (disabled ? "#D0D5DD" : "#727271"),
        background: checked ? (disabled ? "#99b5d0" : "#00346B") : (disabled ? "#F5F5F5" : "#fff"),
        cursor: disabled ? "not-allowed" : "pointer",
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        opacity: disabled ? 0.5 : 1,
        flexShrink: 0,
        transition: "background 0.15s",
      }}
    >
      {checked && (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      )}
    </div>
  );
}

const selStyle = (dis) => ({
  fontFamily: "'Poppins', sans-serif", fontSize: 11, color: "#2B2A29",
  background: dis ? "#F5F5F5" : "#fff",
  border: "1px solid #D0D5DD", borderRadius: 4,
  padding: "6px 8px", width: 170, outline: "none",
  cursor: dis ? "not-allowed" : "pointer", opacity: dis ? 0.35 : 1,
});

const thBase = { fontSize: 12, fontWeight: 500, color: "#2B2A29", padding: "6px 12px", verticalAlign: "middle", borderBottom: "none", whiteSpace: "nowrap" };
const ctrlBase = { padding: "6px 12px", verticalAlign: "middle", borderBottom: "none" };
const tdCell = { padding: "12px 12px", borderTop: "1px solid #F2F4F8" };
const btnPrimary = { fontFamily: "inherit", fontSize: 13, fontWeight: 500, padding: "9px 24px", borderRadius: 20, cursor: "pointer", border: "none", background: "#00346B", color: "#fff" };
const btnOutline = { fontFamily: "inherit", fontSize: 13, fontWeight: 500, padding: "9px 24px", borderRadius: 20, cursor: "pointer", background: "#fff", color: "#00346B", border: "1.5px solid #00346B" };
const btnSmall = { fontFamily: "inherit", fontSize: 12, fontWeight: 500, color: "#00346B", background: "none", border: "1px solid #00346B", borderRadius: 4, padding: "5px 14px", cursor: "pointer" };

/* ═══════════════════════ TOPBAR ═══════════════════════ */
function Topbar() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 48, padding: "0 24px", borderBottom: "1px solid #E8ECF0" }}>
      <div style={{ display: "flex", alignItems: "center", border: "1.5px solid #00346B", borderRadius: 4, padding: "5px 12px", gap: 8, width: 400 }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#B3B3B2" strokeWidth="2.5"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
        <input placeholder="Find a worker, project, company..." style={{ border: "none", outline: "none", fontFamily: "inherit", fontSize: 12, width: "100%", color: "#2B2A29" }} />
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 12, fontWeight: 500 }}>kmukmin@fieldca.com</div>
          <div style={{ fontSize: 11, color: "#727271" }}>Field Control Analytics - Super Admin</div>
        </div>
        <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#004A91", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 600 }}>KM</div>
        <span style={{ fontSize: 12, fontWeight: 500, color: "#00346B", cursor: "pointer" }}>Help</span>
      </div>
    </div>
  );
}

/* ═══════════════════════ STEP INDICATOR ═══════════════════════ */
function StepIndicator({ step }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ width: 28, height: 28, borderRadius: "50%", background: step >= 1 ? "#00346B" : "#D0D5DD", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 600 }}>1</div>
        <span style={{ fontSize: 12, fontWeight: step === 1 ? 600 : 400, color: step >= 1 ? "#00346B" : "#727271" }}>Worker Profile Fields</span>
      </div>
      <div style={{ width: 40, height: 1, background: "#D0D5DD", margin: "0 12px" }} />
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ width: 28, height: 28, borderRadius: "50%", background: step >= 2 ? "#00346B" : "#D0D5DD", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 600 }}>2</div>
        <span style={{ fontSize: 12, fontWeight: step === 2 ? 600 : 400, color: step >= 2 ? "#00346B" : "#727271" }}>Consent Form Fields</span>
      </div>
      <div style={{ width: 40, height: 1, background: "#D0D5DD", margin: "0 12px" }} />
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ width: 28, height: 28, borderRadius: "50%", background: step >= 3 ? "#00346B" : "#D0D5DD", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 600 }}>3</div>
        <span style={{ fontSize: 12, fontWeight: step === 3 ? 600 : 400, color: step >= 3 ? "#00346B" : "#727271" }}>Consent Form Preview</span>
      </div>
      <div style={{ width: 40, height: 1, background: "#D0D5DD", margin: "0 12px" }} />
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ width: 28, height: 28, borderRadius: "50%", background: step >= 4 ? "#00346B" : "#D0D5DD", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 600 }}>4</div>
        <span style={{ fontSize: 12, fontWeight: step === 4 ? 600 : 400, color: step >= 4 ? "#00346B" : "#727271" }}>Worker Snapshot</span>
      </div>
    </div>
  );
}

/* ═══════════════════════ STEP 4 - WORKER SNAPSHOT ═══════════════════════ */

const CONSENT_SAMPLE = {
  "Job Title": "Laborer",
  "Project Trade": "Concrete",
  "Trade Status": "Journeyman",
  "Last 4 SSN": "4532",
  "Supervisor Name": "—",
  "Supervisor Phone": "—",
  "Section 3 Employee": "No",
  "Section 3 Resident": "No",
  "Date of Hire": "01/15/2024",
  "Eligible To Work In Us": "Yes",
  "Years of Experience": "More than 8 years [8-13]",
  "Hourly / Salary": "Hourly",
  "Hourly Rate of Pay": "\$42.00",
  "LGBTQ": "—",
  "Hard Hat Number": "—",
  "Referred by Building Skills NY": "No",
  "Listed on NYCHA Lease": "No",
  "Blah": "—",
  "Date Test": "—",
  "Test Select": "—",
};

function InfoField({ label, value }) {
  return (
    <div style={{ minWidth: 0 }}>
      <div style={{ fontSize: 11, color: "#727271", marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 600, color: "#2B2A29", wordBreak: "break-word" }}>{value || "—"}</div>
    </div>
  );
}

function SectionCard({ title, children, editAction }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #E8ECF0", borderRadius: 8, marginBottom: 16, overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderBottom: "1px solid #E8ECF0", background: "#FAFBFD" }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: "#00346B" }}>{title}</span>
        {editAction && (
          <span onClick={editAction} style={{ fontSize: 12, color: "#004A91", cursor: "pointer", fontWeight: 500 }}>Edit ✎</span>
        )}
      </div>
      <div style={{ padding: "16px 20px" }}>
        {children}
      </div>
    </div>
  );
}

function ConsentSubsection({ title, fields, sampleData }) {
  const visible = fields.filter(f => f.v);
  if (visible.length === 0) return null;
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: "#2B2A29", marginBottom: 10 }}>{title}</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
        {visible.map((f, i) => (
          <InfoField key={i} label={f.n} value={sampleData[f.n] || "—"} />
        ))}
      </div>
    </div>
  );
}

function Step4({ standard, custom, profileData, setStep, formVals }) {
  const storedFields = [];
  profileData.forEach(sec => sec.fields.forEach(f => {
    if (f.st) storedFields.push(f);
  }));

  const visibleStandard = standard.filter(f => f.v);
  const visibleCustom = custom.filter(f => f.v);
  const hasStandard = visibleStandard.length > 0;
  const hasCustom = visibleCustom.length > 0;
  const hasStored = storedFields.length > 0;
  const hasConsent = hasStandard || hasCustom || hasStored;

  // Build lookup from formVals for first employer (index 0)
  function getStdVal(fi) { return formVals["std-0-" + fi] || "—"; }
  function getCstVal(fi) { return formVals["cst-0-" + fi] || "—"; }

  return (
    <div>
      {/* Header bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", background: "#00346B", borderRadius: 8, marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ color: "#fff", fontSize: 14, fontWeight: 600 }}>FCA</span>
          <span style={{ color: "#66A9D9", fontSize: 13 }}>Kate Testing Project</span>
        </div>
        <span style={{ color: "#66A9D9", fontSize: 18, cursor: "pointer" }}>✕</span>
      </div>

      {/* Project Information */}
      <SectionCard title="Project Information">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
          <InfoField label="Project Name" value="Kate Testing Project" />
          <InfoField label="Company" value="Kate GC" />
          <InfoField label="Worker" value="Hank Ruth" />
        </div>
      </SectionCard>

      {/* Consent Form Fields */}
      {hasConsent && (
        <SectionCard title="Consent Form Fields — Kate GC">
          {hasStandard && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#2B2A29", marginBottom: 10 }}>Standard Fields</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
                {visibleStandard.map((f, i) => (
                  <InfoField key={i} label={f.n} value={formVals["std-0-" + i] || "—"} />
                ))}
              </div>
            </div>
          )}
          {hasCustom && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#2B2A29", marginBottom: 10 }}>Custom Fields</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
                {visibleCustom.map((f, i) => (
                  <InfoField key={i} label={f.n} value={formVals["cst-0-" + i] || "—"} />
                ))}
              </div>
            </div>
          )}
          {hasStored && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#2B2A29" }}>Stored Fields</span>
                <span style={{ fontSize: 10, color: "#1BB161", fontWeight: 500, background: "#1BB16115", padding: "2px 8px", borderRadius: 4 }}>Auto-populated</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
                {storedFields.map((f, i) => (
                  <InfoField key={i} label={f.n} value={SAMPLE_DATA[f.n] || "—"} />
                ))}
              </div>
            </div>
          )}
        </SectionCard>
      )}

      {/* Badge Template */}
      <SectionCard title="Badge Template">
        <InfoField label="Badge Template" value="GC Demo – Default Badge" />
      </SectionCard>

      {/* Exemptions */}
      <SectionCard title="Exemptions">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
          <InfoField label="Certification Exemptions" value="None" />
          <InfoField label="Training Exemptions" value="None" />
          <InfoField label="Course Exemptions" value="FCA Learning Demo Course, OSHA Demo Course" />
        </div>
      </SectionCard>

      {/* Bottom buttons */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 20, paddingBottom: 20 }}>
        <button onClick={() => setStep(3)} style={btnOutline}>Back</button>
      </div>
    </div>
  );
}

/* ═══════════════════════ STEP 3 - CONSENT FORM PREVIEW ═══════════════════════ */

const EMPLOYERS = ["Kate GC", "Kate's Ceiling"];

const SAMPLE_DATA = {
  "Ethnicity": "Hispanic or Latino",
  "Gender": "Male",
  "Primary Language": "English",
  "Are you a veteran?": "No",
  "First Name": "John",
  "Middle Name": "A.",
  "Last Name": "Smith",
  "Allergies": "None",
  "Date of Birth": "03/15/1988",
  "Last SSN": "4532",
  "Role": "Laborer",
  "Labor Union": "Local 79",
  "Trades": "Concrete",
  "Work Experience": "More than 8 years [8-13]",
  "Labor Union Number": "79-44821",
  "Alternate Phone": "(212) 555-0199",
  "Email": "john.smith@email.com",
  "Mobile Phone": "(917) 555-0134",
  "Email Or Mobile Phone": "john.smith@email.com",
  "Address Line 1": "142 W 36th St",
  "Address Line 2": "Apt 5B",
  "Country": "United States",
  "State/Province/Territory": "New York",
  "City": "New York",
  "Zip Code": "10018",
  "Emergency Contact Name": "Jane Smith",
  "Emergency Contact Relationship": "Spouse",
  "Emergency Contact Mobile Phone": "(917) 555-0178",
  "ID Type": "Driver's License",
  "Issued By": "NY DMV",
  "ID Number": "S-12345678",
};

const NAV_ITEMS = [
  { label: "Worker Registration", done: true, dimmed: true },
  { label: "Biometric Consent", done: true, dimmed: true },
  { label: "Take a Photo", done: true },
  { label: "Personal Information", done: true },
  { label: "Certifications", done: false },
  { label: "Consent Form", done: true, active: true },
  { label: "Project Courses", done: true },
];

function FormField({ name, type, mandatory, disabled, value, onChange }) {
  const isSelect = type.startsWith("Select");
  const isDate = type.startsWith("Date");
  const hasValue = !!(value || "");

  const fieldStyle = {
    width: "100%",
    padding: hasValue ? "20px 14px 8px 14px" : "14px 14px",
    borderRadius: 6,
    border: "1px solid #D0D5DD",
    fontFamily: "'Poppins', sans-serif",
    fontSize: 13,
    color: disabled ? "#727271" : "#2B2A29",
    background: disabled ? "#F5F7FA" : "#fff",
    outline: "none",
    cursor: disabled ? "not-allowed" : "text",
    appearance: "none",
    WebkitAppearance: "none",
  };

  return (
    <div style={{ position: "relative" }}>
      {hasValue && (
        <span style={{
          position: "absolute", left: 14, top: 6,
          fontSize: 10, color: "#727271", fontWeight: 500,
          pointerEvents: "none",
        }}>
          {name}{mandatory ? <span style={{ color: "#DF252A" }}> *</span> : ""}
        </span>
      )}
      {(isSelect || isDate) && (
        <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "#727271", fontSize: 12, pointerEvents: "none" }}>
          {isDate ? "📅" : "▾"}
        </span>
      )}
      <input
        type="text"
        readOnly={disabled}
        placeholder={!hasValue ? name + (mandatory ? " *" : "") : ""}
        value={value || ""}
        onChange={e => !disabled && onChange && onChange(e.target.value)}
        style={fieldStyle}
      />
    </div>
  );
}

function Step3({ standard, custom, profileData, setStep, formVals, setFormVals }) {
  const visibleStandard = standard.filter(f => f.v);
  const visibleCustom = custom.filter(f => f.v);
  const storedFields = [];
  profileData.forEach(sec => sec.fields.forEach(f => {
    if (f.st) storedFields.push(f);
  }));

  const hasStandard = visibleStandard.length > 0;
  const hasCustom = visibleCustom.length > 0;
  const hasStored = storedFields.length > 0;
  const hasAny = hasStandard || hasCustom || hasStored;

  function getVal(section, empIdx, fieldIdx) {
    return formVals[section + "-" + empIdx + "-" + fieldIdx] || "";
  }
  function setVal(section, empIdx, fieldIdx, val) {
    setFormVals(prev => ({ ...prev, [section + "-" + empIdx + "-" + fieldIdx]: val }));
  }

  return (
    <div style={{ display: "flex", gap: 0, minHeight: 500 }}>

      {/* LEFT SIDEBAR */}
      <div style={{ width: 260, flexShrink: 0, borderRight: "1px solid #E8ECF0", paddingTop: 4 }}>
        <div style={{ padding: "12px 16px" }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#2B2A29" }}>Kate Testing Project</div>
          <div style={{ fontSize: 11, color: "#727271", marginTop: 2 }}>Kate GC, Kate's Ceiling</div>
        </div>
        <div style={{ marginTop: 8 }}>
          {NAV_ITEMS.map((item, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px" }}>
              <div style={{
                width: 24, height: 24, borderRadius: "50%",
                background: item.active ? "#00346B" : "none",
                border: item.active ? "none" : item.done ? "2px solid #1BB161" : "2px solid #D0D5DD",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}>
                {item.done && !item.active && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#1BB161" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                )}
                {item.active && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                )}
              </div>
              {i < NAV_ITEMS.length - 1 && (
                <div style={{ position: "absolute", left: 27, marginTop: 34, width: 1, height: 20, background: "#E8ECF0" }} />
              )}
              <span style={{
                fontSize: 12,
                fontWeight: item.active ? 600 : 400,
                color: item.dimmed ? "#B3B3B2" : item.active ? "#00346B" : "#2B2A29",
              }}>{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div style={{ flex: 1, padding: "20px 32px" }}>
        <div style={{ fontSize: 22, fontWeight: 600, color: "#2B2A29", marginBottom: 4 }}>Consent Form</div>
        <div style={{ fontSize: 13, color: "#727271", marginBottom: 24 }}>Enter your consent information</div>

        {!hasAny && (
          <div style={{ padding: "40px 0", textAlign: "center", color: "#B3B3B2", fontSize: 13 }}>
            No fields are visible on the consent form. Go back to Step 2 to enable fields.
          </div>
        )}

        {/* STANDARD FIELDS */}
        {hasStandard && (
          <>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#727271", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 12 }}>Standard Fields</div>
            {EMPLOYERS.map((emp, ei) => (
              <div key={ei} style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: "#2B2A29", marginBottom: 12 }}>{emp}</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  {visibleStandard.map((f, fi) => (
                    <FormField key={fi} name={f.n} type={f.t} mandatory={f.m} disabled={false} value={getVal("std", ei, fi)} onChange={val => setVal("std", ei, fi, val)} />
                  ))}
                </div>
                {ei < EMPLOYERS.length - 1 && <div style={{ borderBottom: "1px solid #E8ECF0", marginTop: 24 }} />}
              </div>
            ))}
          </>
        )}

        {/* CUSTOM FIELDS */}
        {hasCustom && (
          <>
            <div style={{ borderTop: hasStandard ? "1px solid #E8ECF0" : "none", paddingTop: hasStandard ? 20 : 0, marginTop: hasStandard ? 4 : 0 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#727271", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 12 }}>Custom Fields</div>
              {EMPLOYERS.map((emp, ei) => (
                <div key={ei} style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: "#2B2A29", marginBottom: 12 }}>{emp}</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    {visibleCustom.map((f, fi) => (
                      <FormField key={fi} name={f.n} type={f.t} mandatory={f.m} disabled={false} value={getVal("cst", ei, fi)} onChange={val => setVal("cst", ei, fi, val)} />
                    ))}
                  </div>
                  {ei < EMPLOYERS.length - 1 && <div style={{ borderBottom: "1px solid #E8ECF0", marginTop: 24 }} />}
                </div>
              ))}
            </div>
          </>
        )}

        {/* STORED FIELDS */}
        {hasStored && (
          <>
            <div style={{ borderTop: (hasStandard || hasCustom) ? "1px solid #E8ECF0" : "none", paddingTop: (hasStandard || hasCustom) ? 20 : 0, marginTop: (hasStandard || hasCustom) ? 4 : 0 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#727271", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6 }}>Stored Fields</div>
              <div style={{ fontSize: 11, color: "#727271", marginBottom: 6 }}>
                Employers: {EMPLOYERS.join(", ")}
              </div>
              <div style={{ fontSize: 11, color: "#727271", marginBottom: 14 }}>
                To edit these fields, go back to the corresponding profile section.
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
                {storedFields.map((f, fi) => (
                  <FormField key={fi} name={f.n} type={f.t} mandatory={true} disabled={true} value={SAMPLE_DATA[f.n] || "—"} />
                ))}
              </div>
            </div>
          </>
        )}

        {/* Bottom buttons */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 20, paddingBottom: 20 }}>
          <button onClick={() => setStep(2)} style={btnOutline}>Back</button>
          <button onClick={() => setStep(4)} style={btnPrimary}>Continue</button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════ MAIN APP ═══════════════════════ */
function App() {
  const [step, setStep] = useState(1);
  const [profileData, setProfileData] = useState(() => clone(INIT_PROFILE));
  const [collapsed, setCol] = useState({});
  const [override, setOverride] = useState(false);
  const [modal, setModal] = useState(null);

  // Step 2 state
  const [standard, setStandard] = useState(() => clone(INIT_STANDARD));
  const [custom, setCustom] = useState(() => clone(INIT_CUSTOM));
  const [consent2Col, setConsent2Col] = useState({ standard: true, custom: true, stored: true });

  // Step 3 form values (lifted up for Step 4)
  const [formVals, setFormVals] = useState({});

  /* ── Step 1 handlers ── */
  function handleOverride(checked) {
    setOverride(checked);
    if (checked) {
      const c = {};
      profileData.forEach(s => { c[s.name] = true; });
      setCol(c);
    }
  }

  function upd(si, fi, changes) {
    const f = profileData[si].fields[fi];
    if (changes.v === true && !f.v && f.pii) {
      setModal({ si, fi, changes });
      return;
    }
    // Prevent stored if not mandatory
    if (changes.st === true && !f.m) return;
    // Prevent skippable if not mandatory
    if (changes.sk === true && !f.m) return;
    // Prevent mandatory if not visible
    if (changes.m === true && !f.v) return;
    setProfileData(prev => {
      const next = clone(prev);
      Object.assign(next[si].fields[fi], changes);
      applyRules(next[si].fields[fi]);
      return next;
    });
  }

  function confirmModal() {
    if (!modal) return;
    const { si, fi, changes } = modal;
    setProfileData(prev => {
      const next = clone(prev);
      Object.assign(next[si].fields[fi], changes);
      applyRules(next[si].fields[fi]);
      return next;
    });
    setModal(null);
  }

  function toggleAllCol(key, val) {
    setProfileData(prev => {
      const next = clone(prev);
      next.forEach(sec => {
        sec.fields.forEach(f => {
          if (f.locked && (key === "v" || key === "m")) return;
          if (f.noMand && key === "m") return;
          if (f.noSkip && key === "sk") return;
          if (key === "st" && !f.m) return;
          if (key === "sk" && !f.m) return;
          f[key] = val;
          applyRules(f);
        });
      });
      return next;
    });
  }

  function allChecked(key) {
    let eligible = 0, checked = 0;
    profileData.forEach(sec => sec.fields.forEach(f => {
      let canToggle = true;
      if (key === "v" && f.locked) canToggle = false;
      if (key === "m" && (f.locked || f.noMand)) canToggle = false;
      if (key === "st" && !f.m) canToggle = false;
      if (key === "sk" && (f.noSkip || !f.m)) canToggle = false;
      if (canToggle) { eligible++; if (f[key]) checked++; }
    }));
    return eligible > 0 && checked === eligible;
  }
  function countChecked(key) { let t = 0, c = 0; profileData.forEach(s => s.fields.forEach(f => { t++; if (f[key]) c++; })); return c + "/" + t; }
  function anyPiiVisible() { return profileData.some(s => s.fields.some(f => f.pii && f.v)); }

  // Stored fields from step 1
  function getStoredFields() {
    const stored = [];
    profileData.forEach(sec => sec.fields.forEach(f => {
      if (f.st) stored.push({ n: f.n, t: "Auto-Populated", v: true, m: true, autoPopulated: true });
    }));
    return stored;
  }

  /* ── Step 2 drag handlers ── */
  const dragItem = useRef(null);
  const dragOverItem = useRef(null);
  const dragSection = useRef(null);

  function handleDragStart(sectionKey, idx) {
    dragItem.current = idx;
    dragSection.current = sectionKey;
  }
  function handleDragOver(e, sectionKey, idx) {
    e.preventDefault();
    if (dragSection.current !== sectionKey) return;
    dragOverItem.current = idx;
  }
  function handleDrop(sectionKey) {
    if (dragSection.current !== sectionKey) return;
    const from = dragItem.current;
    const to = dragOverItem.current;
    if (from === null || to === null || from === to) return;

    if (sectionKey === "standard") {
      setStandard(prev => {
        const next = [...prev];
        const [item] = next.splice(from, 1);
        next.splice(to, 0, item);
        return next;
      });
    } else if (sectionKey === "custom") {
      setCustom(prev => {
        const next = [...prev];
        const [item] = next.splice(from, 1);
        next.splice(to, 0, item);
        return next;
      });
    }
    dragItem.current = null;
    dragOverItem.current = null;
  }

  function updConsent(sectionKey, idx, changes) {
    const setter = sectionKey === "standard" ? setStandard : setCustom;
    setter(prev => {
      const next = clone(prev);
      Object.assign(next[idx], changes);
      if (!next[idx].v) next[idx].m = false;
      return next;
    });
  }

  /* ═══════════════════════ RENDER ═══════════════════════ */
  return (
    <div style={{ fontFamily: "'Poppins', sans-serif", background: "#fff", minHeight: "100vh", color: "#2B2A29" }}>
      <Topbar />

      <div style={{ padding: "24px 32px", maxWidth: 1200, margin: "0 auto" }}>
        <StepIndicator step={step} />

        {/* ════════ STEP 1 ════════ */}
        {step === 1 && (
          <>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 14 }}>Worker Profile Fields</div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12, cursor: "pointer", marginBottom: 10 }}>
                <input type="checkbox" checked={override} onChange={e => handleOverride(e.target.checked)} style={{ accentColor: "#00346B", width: 14, height: 14 }} />
                Override setup for all companies
              </label>
            </div>

            {override && (<>
              <div style={{ borderRadius: 6, border: "1px solid #F59A00", background: "#FFF8EC", padding: "12px 14px", display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#F59A00" }}>
                  <span style={{ fontSize: 14 }}>⚠</span>
                  If Override disabled, this project will not accommodate Unverified workers.
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#F59A00" }}>
                  <span style={{ fontSize: 14 }}>⚠</span>
                  When PII fields are visible, the project cannot accommodate Unverified workers.
                </div>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 6, fontSize: 12, color: "#F59A00" }}>
                  <span style={{ fontSize: 14 }}>⚠</span>
                  Stored fields must be mandatory. They will appear in a separate section of the project consent form and will be auto-populated from the data the worker provides in the profile fields.
                </div>
              </div>

              {/* PII Modal */}
              {modal && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999 }}>
                  <div style={{ background: "#fff", borderRadius: 10, padding: "24px 28px", maxWidth: 420, width: "100%", boxShadow: "0 8px 30px rgba(0,0,0,0.15)" }}>
                    <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 10 }}>Warning</div>
                    <div style={{ fontSize: 13, lineHeight: 1.6, marginBottom: 18 }}>When PII fields are visible, the project cannot accommodate Unverified workers.</div>
                    <div style={{ display: "flex", gap: 10 }}>
                      <span onClick={() => setModal(null)} style={{ fontSize: 13, fontWeight: 500, color: "#00346B", cursor: "pointer" }}>Cancel</span>
                      <span onClick={confirmModal} style={{ fontSize: 13, fontWeight: 500, color: "#DF252A", cursor: "pointer", marginLeft: 12 }}>Make Visible</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Expand / Collapse */}
              <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                {!profileData.every(s => !collapsed[s.name]) && (
                  <button onClick={() => setCol({})} style={btnSmall}>Expand All</button>
                )}
                {!profileData.every(s => collapsed[s.name]) && (
                  <button onClick={() => { const c = {}; profileData.forEach(s => { c[s.name] = true; }); setCol(c); }} style={btnSmall}>Collapse All</button>
                )}
              </div>

              {/* TABLE */}
              <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #E8ECF0" }}>
                <colgroup>
                  <col style={{ width: 36 }} /><col /><col style={{ width: 130 }} />
                  <col style={{ width: 80 }} /><col style={{ width: 100 }} /><col style={{ width: 80 }} />
                  <col style={{ width: 90 }} /><col style={{ width: 185 }} />
                </colgroup>
                <thead>
                  <tr>
                    <th style={thBase} />
                    <th style={{ ...thBase, textAlign: "left" }}>Input Name</th>
                    <th style={{ ...thBase, textAlign: "left" }}>Input Type</th>
                    <th style={{ ...thBase, textAlign: "center" }}>Visible</th>
                    <th style={{ ...thBase, textAlign: "center" }}>Mandatory</th>
                    <th style={{ ...thBase, textAlign: "center" }}>Stored</th>
                    <th style={{ ...thBase, textAlign: "center" }}>Skippable</th>
                    <th style={{ ...thBase, textAlign: "center" }}>Skippable Until</th>
                  </tr>
                  <tr>
                    <td style={ctrlBase} /><td style={ctrlBase} /><td style={ctrlBase} />
                    <td style={{ ...ctrlBase, textAlign: "center" }}><Cb checked={allChecked("v")} onChange={val => toggleAllCol("v", val)} /></td>
                    <td style={{ ...ctrlBase, textAlign: "center" }}><Cb checked={allChecked("m")} onChange={val => toggleAllCol("m", val)} /></td>
                    <td style={{ ...ctrlBase, textAlign: "center" }}><Cb checked={allChecked("st")} onChange={val => toggleAllCol("st", val)} /></td>
                    <td style={{ ...ctrlBase, textAlign: "center" }}><Cb checked={allChecked("sk")} onChange={val => toggleAllCol("sk", val)} /></td>
                    <td style={ctrlBase} />
                  </tr>
                  <tr>
                    {[0,1,2].map(i => <td key={i} style={{ ...ctrlBase, borderBottom: "1px solid #E8ECF0" }} />)}
                    <td style={{ ...ctrlBase, borderBottom: "1px solid #E8ECF0", textAlign: "center", fontSize: 11, color: "#727271" }}>{countChecked("v")}</td>
                    <td style={{ ...ctrlBase, borderBottom: "1px solid #E8ECF0", textAlign: "center", fontSize: 11, color: "#727271" }}>{countChecked("m")}</td>
                    <td style={{ ...ctrlBase, borderBottom: "1px solid #E8ECF0", textAlign: "center", fontSize: 11, color: "#727271" }}>{countChecked("st")}</td>
                    <td style={{ ...ctrlBase, borderBottom: "1px solid #E8ECF0", textAlign: "center", fontSize: 11, color: "#727271" }}>{countChecked("sk")}</td>
                    <td style={{ ...ctrlBase, borderBottom: "1px solid #E8ECF0" }} />
                  </tr>
                </thead>
                <tbody>
                  {profileData.map((sec, si) => {
                    const open = !collapsed[sec.name];
                    const rows = [];
                    rows.push(
                      <tr key={"s" + si} onClick={() => setCol(p => ({ ...p, [sec.name]: !p[sec.name] }))} style={{ cursor: "pointer" }}>
                        <td colSpan={8} style={{ padding: "12px 12px", fontSize: 13, fontWeight: 600, borderTop: "1px solid #E8ECF0", background: "#D4E7F5" }}>
                          {sec.name}
                          <span style={{ fontWeight: 400, fontSize: 11, color: "#B3B3B2", marginLeft: 8 }}>{sec.fields.length} fields</span>
                          <span style={{ float: "right", fontSize: 10, color: "#B3B3B2", transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s", display: "inline-block" }}>▼</span>
                        </td>
                      </tr>
                    );
                    if (open) {
                      sec.fields.forEach((f, fi) => {
                        const locked = !!f.locked;
                        const noSkip = !!f.noSkip;
                        const noMand = !!f.noMand;
                        let contactVisDis = false;
                        if (sec.name === "Contact Information") {
                          const eom = sec.fields.find(x => x.n === "Email Or Mobile Phone");
                          const em = sec.fields.find(x => x.n === "Email");
                          const mp = sec.fields.find(x => x.n === "Mobile Phone");
                          if ((f.n === "Email" || f.n === "Mobile Phone") && eom && eom.v) contactVisDis = true;
                          if (f.n === "Email Or Mobile Phone" && ((em && em.v) || (mp && mp.v))) contactVisDis = true;
                        }
                        const visDis = locked || contactVisDis;
                        const mandDis = locked || noMand || !f.v;
                        const storDis = !f.m || f.sk;
                        const skipDis = noSkip || !f.m || f.st;
                        const untilDis = noSkip || !f.sk;

                        rows.push(
                          <tr key={"f" + si + "-" + fi}>
                            <td style={tdCell}><span style={{ color: "#C8CDD8", fontSize: 14, cursor: "grab" }}>⠿</span></td>
                            <td style={{ ...tdCell, fontSize: 13 }}>{f.n}</td>
                            <td style={{ ...tdCell, fontSize: 12, color: "#727271" }}>{f.t}</td>
                            <td style={{ ...tdCell, textAlign: "center" }}><Cb checked={f.v} disabled={visDis} onChange={val => upd(si, fi, { v: val })} /></td>
                            <td style={{ ...tdCell, textAlign: "center" }}><Cb checked={f.m} disabled={mandDis} onChange={val => upd(si, fi, { m: val })} /></td>
                            <td style={{ ...tdCell, textAlign: "center" }}><Cb checked={f.st} disabled={storDis} onChange={val => upd(si, fi, { st: val })} /></td>
                            <td style={{ ...tdCell, textAlign: "center" }}><Cb checked={f.sk} disabled={skipDis} onChange={val => upd(si, fi, { sk: val })} /></td>
                            <td style={tdCell}><select value={f.su} disabled={untilDis} onChange={e => upd(si, fi, { su: e.target.value })} style={selStyle(untilDis)}>{SKIP_OPTS.map(o => <option key={o} value={o}>{o}</option>)}</select></td>
                          </tr>
                        );
                      });
                    }
                    return rows;
                  })}
                </tbody>
              </table>
            </>)}

            {/* Continue - always visible */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 20 }}>
              <button style={btnOutline}>Cancel</button>
              <button onClick={() => setStep(2)} style={btnPrimary}>Continue</button>
            </div>
          </>
        )}

        {/* ════════ STEP 2 ════════ */}
        {step === 2 && (
          <>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 14 }}>Edit Worker Consent Form</div>

            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              {!["standard","custom","stored"].every(k => !consent2Col[k]) && (
                <button onClick={() => setConsent2Col({})} style={btnSmall}>Expand All</button>
              )}
              {!["standard","custom","stored"].every(k => consent2Col[k]) && (
                <button onClick={() => setConsent2Col({ standard: true, custom: true, stored: true })} style={btnSmall}>Collapse All</button>
              )}
            </div>

            {/* Consent Form sections */}
            {[
              { key: "standard", label: "Standard Fields", items: standard, setItems: setStandard, editable: true },
              { key: "custom", label: "Custom Fields", items: custom, setItems: setCustom, editable: true },
              { key: "stored", label: "Stored Fields", items: getStoredFields(), setItems: null, editable: false },
            ].map(({ key, label, items, editable }) => {
              const isOpen = !consent2Col[key];
              return (
                <div key={key} style={{ marginBottom: 16 }}>
                  {/* Section header */}
                  <div
                    onClick={() => setConsent2Col(p => ({ ...p, [key]: !p[key] }))}
                    style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: "#D4E7F5", borderRadius: isOpen ? "6px 6px 0 0" : 6, cursor: "pointer", userSelect: "none", border: "1px solid #E8ECF0" }}
                  >
                    <div>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{label}</span>
                      <span style={{ fontSize: 11, color: "#727271", marginLeft: 8 }}>{items.length} fields</span>
                    </div>
                    <span style={{ fontSize: 10, color: "#727271", transform: isOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s", display: "inline-block" }}>▼</span>
                  </div>

                  {isOpen && (
                    <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #E8ECF0", borderTop: "none" }}>
                      <colgroup>
                        <col style={{ width: 36 }} /><col /><col /><col style={{ width: 80 }} /><col style={{ width: 100 }} />
                      </colgroup>
                      <thead>
                        <tr>
                          <th style={{ ...thBase, borderBottom: "1px solid #E8ECF0" }} />
                          <th style={{ ...thBase, textAlign: "left", borderBottom: "1px solid #E8ECF0" }}>Input Name</th>
                          <th style={{ ...thBase, textAlign: "left", borderBottom: "1px solid #E8ECF0" }}>Input Type</th>
                          <th style={{ ...thBase, textAlign: "center", borderBottom: "1px solid #E8ECF0" }}>Visible</th>
                          <th style={{ ...thBase, textAlign: "center", borderBottom: "1px solid #E8ECF0" }}>Mandatory</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((f, i) => {
                          const mandDis = !f.v || !!f.autoPopulated;
                          const visDis = !!f.autoPopulated;
                          return (
                            <tr key={i}
                              draggable={editable}
                              onDragStart={() => editable && handleDragStart(key, i)}
                              onDragOver={e => editable && handleDragOver(e, key, i)}
                              onDrop={() => editable && handleDrop(key)}
                              style={{ cursor: "default" }}
                            >
                              <td style={{ ...tdCell, cursor: editable ? "grab" : "default" }}><span style={{ color: "#C8CDD8", fontSize: 14 }}>⠿</span></td>
                              <td style={{ ...tdCell, fontSize: 13 }}>{f.n}</td>
                              <td style={{ ...tdCell, fontSize: 12, color: "#727271" }}>{f.t}</td>
                              <td style={{ ...tdCell, textAlign: "center" }}>
                                <Cb checked={f.v} disabled={visDis} onChange={val => editable && updConsent(key, i, { v: val })} />
                              </td>
                              <td style={{ ...tdCell, textAlign: "center" }}>
                                <Cb checked={f.m} disabled={mandDis} onChange={val => editable && updConsent(key, i, { m: val })} />
                              </td>
                            </tr>
                          );
                        })}
                        {items.length === 0 && (
                          <tr><td colSpan={5} style={{ ...tdCell, textAlign: "center", color: "#B3B3B2", fontSize: 12, padding: "20px 12px" }}>
                            {key === "stored" ? "No stored fields. Mark fields as Stored in Worker Profile Fields setup to see them here." : "No fields."}
                          </td></tr>
                        )}
                      </tbody>
                    </table>
                  )}
                </div>
              );
            })}

            {/* Bottom buttons */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 20 }}>
              <button onClick={() => setStep(1)} style={btnOutline}>Back</button>
              <button onClick={() => setStep(3)} style={btnPrimary}>Continue</button>
            </div>
          </>
        )}

        {/* ════════ STEP 3 ════════ */}
        {step === 3 && (
          <Step3
            standard={standard}
            custom={custom}
            profileData={profileData}
            setStep={setStep}
            formVals={formVals}
            setFormVals={setFormVals}
          />
        )}

        {step === 4 && (
          <Step4
            standard={standard}
            custom={custom}
            profileData={profileData}
            setStep={setStep}
            formVals={formVals}
          />
        )}
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(App));
<\/script>
</body>
</html>
`);
  } else {
    const gatePath = path.join(process.cwd(), 'public', 'gate.html');
    const gate = fs.readFileSync(gatePath, 'utf8');
    res.status(200).send(gate);
  }
};
