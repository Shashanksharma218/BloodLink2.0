# BloodLink2 — UI Improvement Plan

This plan was produced from a Playwright-driven walkthrough of the live app on `localhost:5173` at three viewport widths (1440×900 desktop, 768×1024 tablet, 390×844 mobile). Every finding below links the screenshot that captured it and the source file(s) involved.

## How to use this plan in a new chat

Drop one of these in the next session and the agent has everything it needs:

```
@.ui-audit/PLAN.md
```

To work on a single section, point at the heading directly, e.g. *"work through section A (Navigation & IA) of @.ui-audit/PLAN.md"*. Screenshots live in [`.ui-audit/screenshots/`](screenshots/) — every finding links the relevant ones.

## Test accounts used

- Donor: `babumanu2004@gmail.com` / `123456789`
- Hospital: `bloodlink.iiitu@gmail.com` / `123456789`

## Priority key

- **P0** — blocks real users; ship-blocker
- **P1** — significant UX harm or design-system inconsistency
- **P2** — polish, hierarchy, microcopy
- **P3** — nice-to-have

---

## A. Navigation & Information Architecture

### A1 [P0] Mobile has no navigation at all

**Evidence:** [40-mobile-hospital-home.png](screenshots/40-mobile-hospital-home.png), [41-mobile-hospital-donors.png](screenshots/41-mobile-hospital-donors.png)

**Source:** [components/layout/AppShell.jsx:12](../frontend/src/components/layout/AppShell.jsx#L12), [components/layout/Topbar.jsx](../frontend/src/components/layout/Topbar.jsx)

Sidebar is hidden via `hidden md:flex` below 768px. The Topbar has no hamburger button or `Sheet` drawer to replace it, so on a phone the user is stranded on whichever page their post-login redirect lands them.

**Fix:** add a hamburger `<button>` to `Topbar.jsx` that opens a `Sheet` rendering `<Sidebar />` inside. Show only below `md`. Close on route change.

---

### A2 [P0] Seeker mode shows the donor sidebar

**Evidence:** [21-seeker-requests.png](screenshots/21-seeker-requests.png), [23-seeker-request-detail.png](screenshots/23-seeker-request-detail.png)

**Source:** [components/layout/Sidebar.jsx:60-66](../frontend/src/components/layout/Sidebar.jsx#L60-L66), [context/AuthContext.jsx](../frontend/src/context/AuthContext.jsx)

Sidebar branches on `mode` from `AuthContext`, but `mode` only flips when the user clicks the topbar `RoleSwitcher`. Navigating directly to `/seeker/*` (e.g. via deep link or a redirect) keeps `mode === 'donor'`, so the sidebar renders DONOR_NAV pointing at `/donor/*`. Verified — the snapshot of `/seeker/requests` shows sidebar links pointing to `/donor/feed`, `/donor/pledges`, etc.

**Fix:** in `AuthContext`, derive `mode` from `useLocation().pathname` (auto-switch to `'seeker'` when path starts with `/seeker`, `'donor'` for `/donor`). The role toggle stays as a manual override.

---

### A3 [P1] SEEKER_NAV is missing a Profile link

**Evidence:** [21-seeker-requests.png](screenshots/21-seeker-requests.png) (sidebar visible)

**Source:** [components/layout/Sidebar.jsx:23-28](../frontend/src/components/layout/Sidebar.jsx#L23-L28)

SEEKER_NAV has Overview, My Requests, New Request, Inventory. No Profile entry — a seeker has no sidebar path to edit their phone or address.

**Fix:** append `{ to: '/donor/profile', label: 'Profile', icon: User }` to SEEKER_NAV. Donor and Seeker share one User document, so the donor profile route is the right destination.

---

### A4 [P2] Brand wordmark duplicated for screen readers

**Evidence:** [01-public-home.png](screenshots/01-public-home.png) — the page-snapshot reads `link "BloodLink BloodLink"`.

**Source:** [components/layout/Topbar.jsx:25-28](../frontend/src/components/layout/Topbar.jsx#L25-L28)

The drop image has `alt="BloodLink"` and a sibling `<span>BloodLink</span>` is rendered. Visually fine; for assistive tech the link's accessible name is "BloodLink BloodLink".

**Fix:** change the img's `alt` to `""` (decorative) — the wordmark is already a sibling text node.

---

### A5 [P3] Avatar dropdown lacks a Profile link

**Evidence:** [24-avatar-dropdown.png](screenshots/24-avatar-dropdown.png)

**Source:** [components/layout/Topbar.jsx:41-56](../frontend/src/components/layout/Topbar.jsx#L41-L56)

Dropdown shows name/email/Change password/Log out only. Adding "Profile" between email and Change password makes the avatar the universal account hub — particularly valuable on mobile where the sidebar isn't always visible.

---

## B. Design System Consistency

### B1 [P1] Three different stat-card designs in one app

**Evidence:**
- Hospital Overview pattern → [30-hospital-home.png](screenshots/30-hospital-home.png) (icon-circle top-left, big number, label below)
- Hospital Donors pattern → [34-hospital-donors.png](screenshots/34-hospital-donors.png) (no icon, big number in tinted pill)
- Donor Overview pattern → [10-donor-home.png](screenshots/10-donor-home.png) (label + Lucide icon top-right, big number, **except** Donor Status which renders a badge instead)

**Source:** [pages/donor/Home.jsx](../frontend/src/pages/donor/Home.jsx), [pages/hospital/Home.jsx](../frontend/src/pages/hospital/Home.jsx), [pages/hospital/Donors.jsx](../frontend/src/pages/hospital/Donors.jsx)

**Fix:** pick one pattern (Hospital Overview is cleanest), extract `components/shared/StatCard.jsx` with props `icon`, `tone`, `value`, `label`, `helper?`, replace all three call sites. For the Recovering-with-days-left case, render the badge in the `value` slot.

---

### B2 [P1] Native `<select>` mixed with shadcn Select

**Evidence:**
- Sign-up — Blood group → [03-public-signup-modal.png](screenshots/03-public-signup-modal.png)
- Forgot password — Account type → [04-public-forgot.png](screenshots/04-public-forgot.png)
- Donor profile — Blood group, Availability preference → [15-donor-profile.png](screenshots/15-donor-profile.png)
- New blood request — Gender, Blood group → [22-seeker-new-request.png](screenshots/22-seeker-new-request.png)
- Record donation — Donation type → [37-hospital-record-donation.png](screenshots/37-hospital-record-donation.png)
- Inventory filters — State, District, Blood group, Component → [16-donor-inventory.png](screenshots/16-donor-inventory.png)

**Source:** [components/ui/select.jsx](../frontend/src/components/ui/select.jsx) (the canonical Select); native `<select>` callsites in [components/AuthModal.jsx](../frontend/src/components/AuthModal.jsx), [pages/public/ForgotPassword.jsx](../frontend/src/pages/public/ForgotPassword.jsx), [pages/donor/Profile.jsx](../frontend/src/pages/donor/Profile.jsx), [pages/seeker/CreateRequest.jsx](../frontend/src/pages/seeker/CreateRequest.jsx), [pages/hospital/RecordDonation.jsx](../frontend/src/pages/hospital/RecordDonation.jsx), [pages/Inventory.jsx](../frontend/src/pages/Inventory.jsx)

On Windows the OS-styled native dropdowns clash with the rest of the form. Also breaks the visual language used by the blood-group chips on Hospital Donors filter bar.

**Fix:** swap each `<select>` for shadcn `Select`. For Inventory's State/District which load async, keep them as `Select` with a loading state inside `SelectContent`.

---

### B3 [P2] Empty states are inconsistent

**Evidence with icon:** [31-hospital-queue.png](screenshots/31-hospital-queue.png), [16-donor-inventory.png](screenshots/16-donor-inventory.png)

**Evidence without icon:** [32-hospital-active.png](screenshots/32-hospital-active.png), [12-donor-pledges.png](screenshots/12-donor-pledges.png), [11-donor-feed.png](screenshots/11-donor-feed.png), [10-donor-home.png](screenshots/10-donor-home.png) (Active Matches strip)

**Source:** [components/shared/EmptyState.jsx](../frontend/src/components/shared/EmptyState.jsx) — exists; use is just inconsistent.

**Fix:** route every empty state through `<EmptyState icon={...} title={...} description={...} action={...} />`. Pick a sensible Lucide icon for each; many empty states would benefit from an action (e.g. Donor "No matches" → "Browse all requests").

---

### B4 [P2] Form footer placement varies

**Evidence:** [15-donor-profile.png](screenshots/15-donor-profile.png), [22-seeker-new-request.png](screenshots/22-seeker-new-request.png), [37-hospital-record-donation.png](screenshots/37-hospital-record-donation.png), [35-hospital-profile.png](screenshots/35-hospital-profile.png)

All right-aligned but spacing/padding differs.

**Fix:** codify a `<FormFooter>` component (or just a Tailwind class string) and apply consistently.

---

## C. Page-specific issues

### C1 [P0] Record Donation requires raw IDs

**Evidence:** [37-hospital-record-donation.png](screenshots/37-hospital-record-donation.png)

**Source:** [pages/hospital/RecordDonation.jsx](../frontend/src/pages/hospital/RecordDonation.jsx)

The form's first two fields are `Pledge ID` (with hint "From an accepted pledge") and `Donor ID (walk-in)` (with hint "The donor's user ID from their BloodLink profile"). No hospital staff member knows a donor's MongoDB `_id` by heart. Form is functionally unusable.

**Fix:** two-section layout —
1. **From a pledge** — searchable `Combobox` listing the hospital's `ACCEPTED` pledges, displaying `donor name · request patient · accepted at`. Selecting one fills `pledgeId`.
2. **Walk-in** — `Combobox` searching `User` records by name/phone/email scoped to `pincode === hospital.pincode`. Reuse the `getNearbyDonors` endpoint already added in [backend/src/controllers/hospitalDashboardController.js](../backend/src/controllers/hospitalDashboardController.js).

Use a tab or radio toggle to disambiguate the two flows.

---

### C2 [P1] Hospital Profile: License number is read-only and empty

**Evidence:** [35-hospital-profile.png](screenshots/35-hospital-profile.png) — Account Info card shows `License number: —`, no field in Edit Details to set it.

**Source:** [pages/hospital/Profile.jsx](../frontend/src/pages/hospital/Profile.jsx), check field on [backend/src/models/Hospital.js](../backend/src/models/Hospital.js)

**Fix:** add `licenseNumber` to the Edit Details form. Verified hospitals should display the value with a green check; unverified should show "Add license to get verified".

---

### C3 [P1] Public home page is just a hero + dead space

**Evidence:** [01-public-home.png](screenshots/01-public-home.png) — entire fullPage capture is hero, then white.

**Source:** [pages/Home.jsx](../frontend/src/pages/Home.jsx), [components/Hero.jsx](../frontend/src/components/Hero.jsx)

First-time visitors see the hero, two CTAs, then nothing. No how-it-works, no features, no footer.

**Fix:** below the hero, add (in this order):
1. **How it works** — three columns: "Sign up", "Get matched", "Donate / Receive". Lucide icons + 1-line copy each.
2. **Why BloodLink** — verified hospitals, location-aware matching, donor status tracking.
3. **Footer** — links to Verify Certificate page (currently has no public entry point), GitHub, contact.

Per project memory this is a semester project — keep it tight, but the current page reads like a 404 below the fold.

---

### C4 [P2] Donor Overview "Donor Status" card breaks the row

**Evidence:** [10-donor-home.png](screenshots/10-donor-home.png) — card 1 shows a badge + "56 days left", cards 2-4 show big numbers with icons.

**Source:** [pages/donor/Home.jsx](../frontend/src/pages/donor/Home.jsx)

Visual rhythm broken; the status card has no icon while the others do.

**Fix:** when refactoring stat cards (B1), give the status card the same shape — render a `<Badge>` in the `value` slot at large size, with `daysUntilAvailable` as the helper line.

---

### C5 [P2] Donor Profile mixes routine edits with destructive opt-out

**Evidence:** [15-donor-profile.png](screenshots/15-donor-profile.png) — bottom of the form has "Registered as a blood donor" checkbox with helper "Disabling this exits you from the donor program". One Save button.

**Source:** [pages/donor/Profile.jsx](../frontend/src/pages/donor/Profile.jsx)

Dangerous control buried in the same card as routine name/phone edits.

**Fix:** move the checkbox into a separate "Donor program" card below "Save changes". Render as a switch with a confirm dialog ([components/shared/ConfirmDialog.jsx](../frontend/src/components/shared/ConfirmDialog.jsx) already exists) when toggling off.

---

### C6 [P2] Seeker RequestDetail wastes vertical space

**Evidence:** [23-seeker-request-detail.png](screenshots/23-seeker-request-detail.png) — Patient, Hospital, Contact Person each get a full-width card with 2-3 fields.

**Source:** [pages/seeker/RequestDetail.jsx](../frontend/src/pages/seeker/RequestDetail.jsx)

**Fix:** 2-col grid above `md`. Patient + Contact Person on the left, Hospital (longer address) full-width on the right. Cuts vertical scroll ~40%.

---

### C7 [P2] Hospital Profile address is a single input

**Evidence:** [35-hospital-profile.png](screenshots/35-hospital-profile.png) — Address `<input>` contains a multi-line address that visually truncates.

**Source:** [pages/hospital/Profile.jsx](../frontend/src/pages/hospital/Profile.jsx)

**Fix:** swap to shadcn `<Textarea>`.

---

### C8 [P1] Mobile data tables clip columns

**Evidence:** [41-mobile-hospital-donors.png](screenshots/41-mobile-hospital-donors.png) — at 390px the Donors table shows DONOR / STATUS / PINCODE; LAST DONATED / DONATIONS / CONTACT / VIEW are clipped.

**Source:** [pages/hospital/Donors.jsx](../frontend/src/pages/hospital/Donors.jsx), [pages/donor/Donations.jsx](../frontend/src/pages/donor/Donations.jsx) (likely same risk)

**Fix:** below `md`, swap the `<Table>` for a stack of `<Card>`s — one per row, with key-value pairs using the same `<dl>` pattern as RequestDetail. Tailwind:

```jsx
<div className="md:hidden">{cardList}</div>
<div className="hidden md:block"><Table>…</Table></div>
```

---

### C9 [P3] Donations vs Certificates count mismatch

**Evidence:** [10-donor-home.png](screenshots/10-donor-home.png) shows TOTAL DONATIONS = 2; [13-donor-donations.png](screenshots/13-donor-donations.png) shows 2 verified rows; [14-donor-certificates.png](screenshots/14-donor-certificates.png) shows only 1 certificate card.

**Source:** [pages/donor/Certificates.jsx](../frontend/src/pages/donor/Certificates.jsx), [backend/src/controllers/certificateController.js](../backend/src/controllers/certificateController.js)

Either certs are issued asynchronously, or there's a backend gap. The user can't tell which.

**Fix:** if certs are issued async, render a "Generating certificate…" placeholder card for verified-but-uncertified donations.

---

## D. Responsive & breakpoints

### D1 [P0] (Already covered by A1 — mobile sidebar)

### D2 [P1] Sidebar breakpoint is too aggressive

**Evidence:** [42-tablet-hospital-donors.png](screenshots/42-tablet-hospital-donors.png) — at exactly 768px the sidebar consumes 224px and the table area becomes scrolly. Stat card labels wrap awkwardly ("ON THIS PAGE" on two lines).

**Source:** [components/layout/AppShell.jsx:12](../frontend/src/components/layout/AppShell.jsx#L12)

**Fix:** options —
- (a) Move the sidebar reveal to `lg` (1024px); rely on the mobile drawer for tablet too.
- (b) Add a "collapsed" state where the sidebar shows icons only at `md`–`lg`, then expands at `lg+`. More work, better space utilization.

---

### D3 [P2] "Awaiting Verify" stat-card label

**Evidence:** [30-hospital-home.png](screenshots/30-hospital-home.png) — fourth card

**Source:** [pages/hospital/Home.jsx](../frontend/src/pages/hospital/Home.jsx)

Grammatically off — "Awaiting verification" reads better. Also: a sibling card is labeled "Pending Verification" — confirm with backend that the two concepts actually count distinct things.

---

## E. Auth modal & forms

### E1 [P2] Sign-up: no field hints

**Evidence:** [03-public-signup-modal.png](screenshots/03-public-signup-modal.png) — Phone and Pincode have no placeholder/format hint.

**Source:** [components/AuthModal.jsx](../frontend/src/components/AuthModal.jsx)

**Fix:** Indian phone is 10 digits, pincode is 6 digits — show that as placeholder text and validate with zod ([zod is already in package.json](../frontend/package.json)).

---

### E2 [P3] Login modal: no "Remember me" / SSO

QoL features. Out of scope for a semester project, flagged for completeness.

---

### E3 [P3] Auth modal closes on outside click

**Source:** [components/AuthModal.jsx](../frontend/src/components/AuthModal.jsx)

Standard Radix `Dialog` behavior. If the user is mid-typing a password and accidentally clicks the dimmed background, they lose what they typed.

**Fix:** set `onPointerDownOutside={(e) => e.preventDefault()}` on `DialogContent` while a field has dirty state.

---

## F. Console / network noise

### F1 [P3] `/api/auth/me` 401s on first paint

**Evidence:** [public-home-console.log](logs/public-home-console.log) — initial load fires `GET /api/auth/me` twice and gets 401 both times.

**Source:** [context/AuthContext.jsx](../frontend/src/context/AuthContext.jsx)

Expected behavior (probing for an existing session) but noisy in DevTools and may double-fire under React 19's strict-mode rules.

**Fix:** options —
- React Query `staleTime: Infinity` on the `me` query so it doesn't refetch.
- Backend returns `200 { user: null }` instead of 401 for the unauthenticated case, so the call doesn't show as a red error.

---

## Suggested execution order

If tackled in pieces, this ordering minimizes file thrash:

1. **A1 + A2 + A3 + D2** — one PR: mobile drawer, role-mode sync, seeker profile link, breakpoint review. Touches `AppShell.jsx`, `Topbar.jsx`, `Sidebar.jsx`, `AuthContext.jsx`. Unblocks mobile and fixes the seeker bug.
2. **C1** — Record Donation searchable pickers. Touches `RecordDonation.jsx`; reuses the `getNearbyDonors` endpoint. Biggest functional gain.
3. **B1 + B2** — `<StatCard>` extraction + native-select sweep. Touches every dashboard and several forms. Best as one consistency pass.
4. **C2 + C7** — Hospital profile fields + textarea. Small, in one go.
5. **C3** — public home content. Independent polish PR.
6. **C8** — mobile table → cards. Independent.
7. **B3 + B4 + C4 + C5 + C6 + D3 + E1** — polish bundle, low-risk cleanups.
8. **F1 + E3** — last.

---

## Out of scope here

- No accessibility audit beyond what surfaced in the Playwright snapshots (no axe run).
- No performance/bundle-size analysis.
- No copy review beyond the labels flagged inline.
- No dark-mode work.

## Appendix: full screenshot index

All captures live in [`screenshots/`](screenshots/).

| File | What |
|------|------|
| [01-public-home.png](screenshots/01-public-home.png) | Public home, 1440×900 |
| [02-public-login-modal.png](screenshots/02-public-login-modal.png) | Login modal |
| [03-public-signup-modal.png](screenshots/03-public-signup-modal.png) | Sign-up modal |
| [04-public-forgot.png](screenshots/04-public-forgot.png) | Forgot password page |
| [05-public-verify-cert.png](screenshots/05-public-verify-cert.png) | `/verify-certificate` (no token → 404) |
| [10-donor-home.png](screenshots/10-donor-home.png) | Donor Overview |
| [11-donor-feed.png](screenshots/11-donor-feed.png) | Donor Matched Requests |
| [12-donor-pledges.png](screenshots/12-donor-pledges.png) | Donor My Pledges |
| [13-donor-donations.png](screenshots/13-donor-donations.png) | Donor Donations history |
| [14-donor-certificates.png](screenshots/14-donor-certificates.png) | Donor Certificates |
| [15-donor-profile.png](screenshots/15-donor-profile.png) | Donor Profile |
| [16-donor-inventory.png](screenshots/16-donor-inventory.png) | Blood Inventory (eRaktKosh) |
| [20-seeker-home.png](screenshots/20-seeker-home.png) | Seeker Overview |
| [21-seeker-requests.png](screenshots/21-seeker-requests.png) | Seeker My Requests (sidebar bug visible) |
| [22-seeker-new-request.png](screenshots/22-seeker-new-request.png) | New Blood Request stepper |
| [23-seeker-request-detail.png](screenshots/23-seeker-request-detail.png) | Request Detail |
| [24-avatar-dropdown.png](screenshots/24-avatar-dropdown.png) | Topbar avatar dropdown |
| [30-hospital-home.png](screenshots/30-hospital-home.png) | Hospital Overview |
| [31-hospital-queue.png](screenshots/31-hospital-queue.png) | Hospital Verification Queue |
| [32-hospital-active.png](screenshots/32-hospital-active.png) | Hospital Active Requests |
| [33-hospital-donations.png](screenshots/33-hospital-donations.png) | Hospital Donations |
| [34-hospital-donors.png](screenshots/34-hospital-donors.png) | Hospital Donors directory |
| [35-hospital-profile.png](screenshots/35-hospital-profile.png) | Hospital Profile |
| [36-hospital-record.png](screenshots/36-hospital-record.png) | Wrong route (`/donations/record`) → 404 — note actual route is `/donations/new` |
| [37-hospital-record-donation.png](screenshots/37-hospital-record-donation.png) | Record Donation form |
| [40-mobile-hospital-home.png](screenshots/40-mobile-hospital-home.png) | Hospital home @ 390px (no nav) |
| [41-mobile-hospital-donors.png](screenshots/41-mobile-hospital-donors.png) | Hospital Donors @ 390px (table clipped) |
| [42-tablet-hospital-donors.png](screenshots/42-tablet-hospital-donors.png) | Hospital Donors @ 768px (sidebar fight) |
