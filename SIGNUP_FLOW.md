# Signup Flow Redesign (Draft)

## Goal

Redesign the signup experience into a **professional, split‑screen** flow with a cover image. The flow is multi‑step:

1. **Customer data**
2. **Company data**

## In a new page.

3. **Plan selection** (centered 3‑plan cards) with **Monthly / Annual (40% off)** toggle above.

---

## Visual Layout

- **Split screen** layout (desktop)
  - **Left panel**: cover image or brand visual
  - **Right panel**: step content
- On mobile: stacked layout (image on top, steps below)

### Left Panel (Cover)

- Full height image or branded gradient
- Short marketing copy + tagline
- Optional logo at top

---

## Step 1: Customer Data

**Fields**

- Full name
- Email
- Password

**CTA**

- “Continue”

---

## Step 2: Company Data

**Fields**

- Company name
- Slug (auto‑suggested)

**CTA**

- “Continue”
- Back

---

## Step 3: Plan Selection

**Layout**

- Plan cards centered, 3 columns on desktop
- Highlight Growth plan
- Above cards: toggle (Monthly / Annual 40% off)

**Plans**

- Free
- Growth (most popular)
- Enterprise

**CTA**

- Free: “Create account”
- Paid: “Continue to payment”

---

## UX Notes

- Step indicator at top (e.g. 1/3, 2/3, 3/3)
- Smooth transitions between steps
- Maintain consistent button placement

---

## Next Steps

- Implement new layout in `/app/(marketing)/signup` and shared UI components
- Update auth flows to match step order
- Keep plan selection in sync with pricing logic (monthly/annual toggle)
