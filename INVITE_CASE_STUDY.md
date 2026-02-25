# Invite Flow Case Study (Draft)

## Scenario
A user receives an organization invitation and accepts it without being logged in.

## Desired UX
**Invite → Accept → Create Account (email prefilled, disabled) → Name + Password → Join Org**

---

## Flow
1) **User opens invite link** `/invite/:token`
2) Clicks **Accept invite**
3) If logged in → **accept immediately**, redirect to `/app`
4) If not logged in → redirect to **/invite/:token/signup**
5) Invite signup screen:
   - **Email prefilled** from invite
   - **Email input disabled** (cannot change)
   - User enters **name + password**
6) On submit:
   - Create account
   - Auto-accept invitation
   - Redirect to `/app`

---

## Re-invite Logic (When user was removed)
- Keep invite history and **always create a new invite record**.
- Block only when there is an **active pending** invite for the same org+email.
- Schema: no unique constraint on `(org_id, email)`; keep a normal index for lookup speed.

## Returning Employee (has account, no org)
- If the user already has an account, they should **sign in** and then accept the invite.
- Flow:
  - Invite link → `/invite/:token`
  - System checks if the invite email already has an account
  - If yes → show only **Sign in** → `/invite/:token/signin`
  - If no → show only **Create account** → `/invite/:token/signup`
  - After sign-in/signup, redirect to `/invite/:token/accept` and accept automatically.

---

## UX Notes
- Add a banner: “You’re invited to join {Org Name}.”
- If invite expired/invalid, show a clear error and link back to home or request a new invite.

---

## Data Needed
- Invitation token → resolve email/org name via `invitations.getByToken`
- Prefill `email` in signup and disable the field

---

## Success Criteria
- Email is locked to invite recipient
- Signup is one-step (name + password)
- User lands directly inside the invited organization
