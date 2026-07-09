# Translation feedback — running log

Rami-supplied changes for the Hebrew translations in `src/i18n/locales/he.json`. Feedback is collected here as it comes in; nothing is applied to code until Rami says "apply".

**Branch:** `feat/v2-hebrew-i18n`
**Started:** 2026-07-08

---

## Pending changes (not yet applied)

### 1. More page — Notifications section

- **`more.sms`** — Current: `SMS` → Proposed: `התראות SMS`
  Match the pattern set for Push earlier (label carries both the tech term + the Hebrew "notifications" prefix so the two toggles read symmetrically in Hebrew).

### 2. Measurement Units — align with Wint Units Format Standards wiki

- Reference: https://wintai.atlassian.net/wiki/spaces/PM/pages/931069965/Wint+Units+Format+Standards
- Rami: "יחידות מידה - יש לעדכן לפי [wiki]"
- Audit the current `more.units.*` keys + any other Hebrew unit references against the wiki's Hebrew Labels table. Wiki-authoritative labels:
  - `L` — ליטרים
  - `Gal` — גלונים
  - `m³` — מ״ק
  - `L/h` — ליטרים לשעה
  - `GPM` — גלונים לדקה
  - `m³/h` — מ״ק לשעה
  - `°C` — מעלות צלזיוס
  - `°F` — מעלות פרנהייט

### 3. More page — both-off warning banner

- **`more.both_off_warning`** — Current: `התראות SMS ודחיפה כבויות.` → Proposed: **`התראות באפליקציה והתראות SMS כבויות.`** *(option B)*
  Repeats "התראות" for each channel so the banner reads exactly parallel to the two toggle labels.

### 4. More page — both-off confirmation modal body

- **`more.both_off_modal.body`** — Current: `עם שתי ההתראות (Push ו-SMS) כבויות, לא תקבל שום התראה על אירועי מים או תקלות. תראה אותן רק בתוך האפליקציה.`
- Still contains the transliterated "Push" (in Latin characters) which is inconsistent with the "התראות באפליקציה" / "הודעות פוש" terminology we're standardizing on. Flagged for review + rewrite. Proposed rewrite for consistency (not yet approved):
  `אם תכבו את שתי ההתראות (באפליקציה וב-SMS) לא תקבלו שום התראה על אירועי מים או תקלות. תראו אותן רק בתוך האפליקציה.`
  Rami to approve or amend.

### 5. Personal Information detail view — not wired at all

Screenshot showed the More → Profile card → Personal Information detail view still fully English despite Hebrew mode being on. The `PersonalInfoView` sub-component inside `src/screens/AccountScreen.jsx` hasn't been wired to `useTranslation()`. Hardcoded strings to extract + translate:

- Header bar title: **"Personal Information"** (blue app bar)
- Card section title: **"Personal Information"** (repeats — should use same key)
- Field labels:
  - **"First Name"** *(need new key `more.profile_fields.first_name` → `שם פרטי`)*
  - **"Last Name"** *(need new key `more.profile_fields.last_name` → `שם משפחה`)*
  - **"Email"** *(key `more.profile_fields.email` exists → `אימייל`, but not wired to the component)*
  - **"Phone number"** *(need `more.profile_fields.phone_number` → `מספר טלפון` — current `more.profile_fields.phone` says just "Phone / טלפון"; update or add second key)*
- Primary action: **"Sign Out"** *(key `more.sign_out` exists → `התנתקות`, not wired)*

Existing keys under `more.profile_fields.*`:
- `full_name` — not used here (component shows First / Last separately)
- `email` ✓
- `phone` — need to be `phone_number` per the actual label
- `role` — not shown in the screenshot but may appear elsewhere
- `account` — not shown

Also: existing `more.personal_information` key = `פרטים אישיים` — should be used for both the header bar title AND the card section title (currently both hardcoded in English).

### 6. Home page — section titles + tooltip not wired

Screenshot review. Every widget's TITLE + the Systems Health explanatory tooltip is still English on the Home page despite Hebrew mode being on. The section-title strings inside `StatusTab` weren't wired to `useTranslation()`, and the tooltip block has no key at all yet.

Hardcoded strings to extract + translate:

- **"Water Events"** section title
  - Key exists: `home.water_events.title` = `אירועי מים` — needs wiring in `HomeUnified.jsx`.
- **"Low Flow" / "High Flow"** pills
  - Keys exist: `home.water_events.low_flow` = `זרימה נמוכה` / `high_flow` = `זרימה גבוהה` — need wiring.
- **"Systems Health"** section title
  - Key exists: `home.systems_health.title` — **update to `מצב המערכות`** *(Rami-approved 2026-07-08, overrides earlier `תקינות המערכות`)*. Also needs wiring in `HomeUnified.jsx`.
  - ⚠ Cascade check: the per-system Health widget uses `תקינות` for related phrases (`בדיקות תקינות` = "passing checks"). Consider whether those should also change for consistency. Rami to decide.
- **Systems Health info tooltip** — the "A system is *healthy* when…" explanatory block that opens on the info-ⓘ tap.
  - No key yet. Add new key `home.systems_health.info_tooltip` (rendered as bulleted list — component needs to support multi-line output; simplest: render `\n` in the string as line breaks, or split into an array of strings).
  - **Rami-approved Hebrew (2026-07-08):**

    ```
    מערכת נחשבת תקינה כאשר:
    היא מדווחת לענן באופן שוטף
    אין שגיאות ברז
    אין תקלות בחיבור המתח
    לפחות נמען אחד רשום לקבלת התראות
    ```

  - Structure: 1 opening line + 4 bullets — maps 1-to-1 to the four Status Overview dimensions below (Comm · Valve · Power · Recipients).
  - Note the deliberate Hebrew distinction: **שגיאות ברז** ("valve errors" — indicator/reading issues) vs. **תקלות בחיבור המתח** ("power connection faults" — physical fault). Both are correct; the two words shouldn't be conflated.
  - English source needs a matching rewrite (the current single-sentence English is longer than the Hebrew now). Draft English to review:

    ```
    A system is healthy when:
    It reports to the cloud regularly
    No valve errors
    No power-connection faults
    At least one recipient is registered for notifications
    ```
- **"Status overview"** section title
  - Key exists: `home.status_overview.title` = `סקירת סטטוס` — needs wiring.

### 7. General Hebrew-wiki alignment pass

- Rami: "update the translation doc in general according to this one"
- Wiki has locked terms + Hebrew labels for months, common UI labels (Date, Time, Duration, Today, Yesterday, Flow Rate, Volume, Temperature, "Just now", filter presets, date-range labels, etc.).
- Audit `he.json` against the wiki's "Date & Time UI Labels" + "Month Names" + "Units" tables. Flag any drift.

---

## Applied

**Commit `8cbb840` on 2026-07-08:**
- ✅ #1 — `more.sms` → `התראות SMS`.
- ✅ #3 — `more.both_off_warning` → `התראות באפליקציה והתראות SMS כבויות.`
- ✅ #4 — `more.both_off_modal.body` rewrite applied; the older "Important Notice / Disabling both…" hardcoded text is gone and the modal now reads from JSON with the PRD-locked copy.
- ✅ #5 — `PersonalInfoView` fully wired to `useTranslation()`. New profile-field keys added: `first_name`, `last_name`, `phone_number`.
- ✅ #6 — Home page section titles wired (Water Events, Systems Health, Status overview). Info tooltip refactored into intro + 4-bullet list format; Rami's approved Hebrew live. `home.systems_health.title` → `מצב המערכות`. Non-`alertsOnly` blocks in StatusWidgetsMobile also wired (Communication / Valves / External Power titles + chip labels + N total sub-lines).
- ✅ Extra: `AccountScreen` main body — push/SMS section titles + row labels wired, warning modal wired to JSON, Tutorial / Learn how to use the app wired, app version footer wired.

**Still open:**
- ⏳ #2 — Measurement Units alignment with the Wint Units Format Standards wiki. (Current EN dropdown values match the wiki symbols; Hebrew values also match the wiki table. Left in Pending as a formal audit against the full wiki table — flow rates, temperature, etc. — since more surfaces beyond this dropdown may reference units.)
- ⏳ #7 — General Hebrew-wiki alignment pass (months, common UI labels, etc.).

---

## Workflow

- Rami adds items in chat (or by editing this file directly).
- Claude appends to Pending; does NOT touch `he.json` or `en.json` or React components.
- When Rami says something like "apply", "go", "make the changes", Claude batches everything from Pending → applies → runs tests → commits → deploys → moves items to Applied.
