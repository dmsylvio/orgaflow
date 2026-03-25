# Public Document Links Strategy

## Client Approval & Viewing System for Estimates and Invoices

## 1. Overview

This document describes the strategy for implementing **public client
links** that allow customers to:

-   View estimates
-   Approve estimates
-   Reject estimates with a reason
-   View invoices
-   Pay invoices (future)
-   Download documents

This feature enables a seamless workflow between the company using
Orgaflow and their clients.

Instead of requiring a login, clients receive a **secure public link**
where they can interact with the document.

This system will support:

-   Estimates
-   Invoices
-   Future documents (contracts, proposals, etc.)

------------------------------------------------------------------------

# 2. Goals

The objective of this feature is to:

-   Simplify client approval workflows
-   Reduce friction in sales processes
-   Provide a professional experience for clients
-   Track client interactions with documents
-   Enable document lifecycle automation

------------------------------------------------------------------------

# 3. Public Document Link Concept

Instead of exposing resource IDs directly, the system will generate a
**secure token-based public link**.

Example:

    https://orgaflow.dev/p/9c4a2f5c8e7b4d2a9f6

Advantages:

-   prevents ID enumeration attacks
-   allows safe sharing
-   works even if organization slug changes
-   reusable architecture for multiple document types

------------------------------------------------------------------------

# 4. Supported Document Types

The system should initially support:

-   Estimates
-   Invoices

Future expansion may include:

-   Contracts
-   Proposals
-   Quotes
-   Agreements

------------------------------------------------------------------------

# 5. Database Architecture

## Table: public_link

  Field             Type        Description
  ----------------- ----------- -----------------------------
  id                text/uuidv7 primary identifier (UUIDv7, same convention as other entity ids)
  token             string      unique secure token for public URL
  organization_id   text/uuidv7  organization
  resource_type     enum        estimate or invoice
  resource_id       text/uuidv7  document ID (internal; never exposed in URL)
  expires_at        timestamp   optional expiration
  created_by        text/uuidv7  user who generated the link
  created_at        timestamp   creation date

------------------------------------------------------------------------

# 6. Token Generation

Tokens must be generated securely.

Example:

``` javascript
crypto.randomBytes(32).toString("hex")
```

This prevents attackers from guessing valid links.

------------------------------------------------------------------------

# 7. Public Routes

Recommended public routes:

    /p/:token
    /p/:token/approve
    /p/:token/reject
    /p/:token/pay

Where:

-   `/p/:token` renders the public document page
-   `/approve` approves the estimate
-   `/reject` rejects the estimate
-   `/pay` processes invoice payment (future)

------------------------------------------------------------------------

# 8. Public Estimate Page

When a client opens the link, they see a structured page:

Example layout:

Company Logo\
Company Information

Estimate #1032\
Date\
Expiration Date

Client Information

------------------------------------------------------------------------

Items

Item \| Qty \| Price \| Total

------------------------------------------------------------------------

Subtotal\
Tax\
Total

------------------------------------------------------------------------

Message from company

------------------------------------------------------------------------

\[Approve\] \[Reject\]

------------------------------------------------------------------------

# 9. Estimate Approval Flow

Client clicks:

    Approve

System action:

    POST /public/estimate/approve

Changes:

-   estimate.status = approved
-   approved_at timestamp saved
-   approved_ip stored
-   approved_user_agent stored

Optional:

-   auto convert estimate to invoice

------------------------------------------------------------------------

# 10. Estimate Rejection Flow

If the client clicks:

    Reject

A modal appears asking:

    Why are you rejecting this estimate?

Client fills:

    [ textarea ]

Submission saves:

-   estimate.status = rejected
-   rejection_reason
-   rejected_at timestamp

This feedback is extremely useful for sales teams.

------------------------------------------------------------------------

# 11. Invoice Public Page

Invoice links use the same architecture but different actions.

Available actions may include:

-   Pay
-   Download PDF
-   Ask a question (future)
-   Dispute (optional)

Example UI:

Invoice #1042\
Amount Due\
Due Date

Items list

------------------------------------------------------------------------

Total

------------------------------------------------------------------------

\[Pay Now\] \[Download\]

------------------------------------------------------------------------

# 12. Document Status Tracking

### Estimate Status

    draft
    sent
    viewed
    approved
    rejected
    expired

### Invoice Status

    draft
    sent
    viewed
    paid
    overdue
    void

------------------------------------------------------------------------

# 13. Document Viewing Tracking

When the client opens the document link:

The system records:

-   viewed_at
-   viewed_ip
-   viewed_user_agent

This allows companies to know when clients viewed their documents.

Example:

"Client viewed estimate at 14:23"

This increases conversion insights.

------------------------------------------------------------------------

# 14. Automatic Invoice Creation

A powerful workflow improvement:

When an estimate is approved:

    estimate → convert to invoice

Example flow:

    estimate approved
    → invoice generated automatically
    → invoice status: pending

------------------------------------------------------------------------

# 15. Security Considerations

Never expose document IDs publicly.

Avoid:

    /estimate/:id

Use:

    secure token links

Benefits:

-   prevents brute force enumeration
-   protects sensitive financial documents
-   allows revocation of links

------------------------------------------------------------------------

# 16. Link Expiration

Optional feature controlled by organization preferences
(`organization_preferences.public_links_expire_enabled` +
`public_links_expire_days`).

When `public_links_expire_enabled = true`, newly created public links
automatically receive an `expires_at` value of `now() + public_links_expire_days`.

Default: disabled (links never expire unless the owner enables this setting).
Configurable range: 1–365 days.

Expired links display a message informing the client the estimate has
expired.

------------------------------------------------------------------------

# 17. Email Notifications

System should notify the organization when actions occur.

### Viewed

"Client viewed estimate" / "Client viewed invoice"

Controlled by `organization_notification_settings.estimate_viewed` and
`invoice_viewed`. Email is sent to `notify_email` (or owner email if null).
See [`notification-settings-architecture.md`](./notification-settings-architecture.md).

### Approved

"Estimate approved by client"

### Rejected

"Estimate rejected"

Include rejection reason.

------------------------------------------------------------------------

# 18. Reusable Public Document Page

Create a reusable component:

    PublicDocumentPage

This component loads:

-   estimate
-   invoice

based on the resource type associated with the token.

This keeps the architecture modular.

------------------------------------------------------------------------

# 19. Future Extensions

This architecture supports future features such as:

-   digital signatures
-   online payments
-   client comments
-   file attachments
-   document version history
-   analytics
-   approval workflows

------------------------------------------------------------------------

# 20. Business Impact

This feature significantly improves product value by enabling:

-   frictionless approvals
-   professional document sharing
-   real-time client interaction
-   automated billing workflows

Typical workflow:

    Send Estimate
    → Client Views
    → Client Approves
    → Invoice Created
    → Client Pays

------------------------------------------------------------------------

# 21. Strategic Value for Orgaflow

Implementing this system positions Orgaflow closer to modern SaaS
platforms such as:

-   HoneyBook
-   Bonsai
-   PandaDoc
-   Stripe Invoicing

while maintaining a lightweight architecture.

------------------------------------------------------------------------

# 22. Summary

The **Public Document Links system** provides a scalable architecture
for client interaction with documents.

Key characteristics:

-   secure token-based access
-   reusable across document types
-   supports approvals and rejections
-   enables future payment integration
-   improves sales conversion tracking

This feature should be considered a **core component of the document
workflow system in Orgaflow**.
