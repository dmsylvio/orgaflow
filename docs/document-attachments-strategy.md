# document-attachments-strategy.md

## Document Attachments for Estimates and Invoices

## Overview

This document defines the strategy for implementing **Document
Attachments** in Orgaflow.

The goal is to allow organizations to attach files to **Estimates** and
**Invoices**, enabling businesses to share supporting materials such as
designs, mockups, contracts, and instructions with their clients.

This feature must remain **optional, configurable, and secure**,
ensuring flexibility for different industries.

------------------------------------------------------------------------

# Goals

The Document Attachments system aims to:

-   Allow files to be attached to estimates and invoices
-   Support visual references and supporting documents
-   Improve communication between companies and clients
-   Maintain control over which files are visible to clients
-   Keep the architecture scalable for future expansion

------------------------------------------------------------------------

# Real-World Example

Consider a business that sells **custom printed t‑shirts**.

## Step 1 --- Create Estimate

The company creates an estimate that includes:

-   quantity
-   price
-   delivery timeline

They attach a **mockup image of the shirt design**.

Client receives the estimate link and can see:

-   estimate items
-   price
-   mockup attachment

This helps the client confirm exactly what will be produced.

------------------------------------------------------------------------

# Attachments Visibility Types

Attachments must support two visibility levels.

## Internal Files

Files visible **only to the organization team**.

Examples:

-   production artwork
-   internal instructions
-   supplier files
-   manufacturing specifications

These files **do not appear in the public client link**.

------------------------------------------------------------------------

## Client Visible Files

Files visible to the client when they open the public document link.

Examples:

-   mockup previews
-   artwork approval files
-   contract PDFs
-   product specifications
-   measurement guides

These files appear in the **public estimate or invoice page**.

------------------------------------------------------------------------

# Supported Document Types

Initially attachments should support:

-   Estimates
-   Invoices

Future expansion may include:

-   Tasks
-   Contracts
-   Customers
-   Projects

------------------------------------------------------------------------

# System Configuration

Location:

Settings → Documents

## File Attachments Settings

Configuration options:

-   Enable attachments on estimates
-   Enable attachments on invoices
-   Allow client visibility for estimate attachments
-   Allow client visibility for invoice attachments
-   Allow client download of attachments

Additional controls:

-   Maximum file size
-   Allowed file types

------------------------------------------------------------------------

# Recommended File Limits

Example limits:

Max file size: 25 MB

Allowed file types:

-   pdf
-   png
-   jpg
-   jpeg
-   svg
-   docx
-   zip

These limits help prevent abuse of storage.

------------------------------------------------------------------------

# Public Document Page

When attachments are marked as **client visible**, they should appear in
the public document page.

Example:

Attachments

-   Shirt-Mockup.png
-   Size-Reference.pdf
-   Artwork-Preview.jpg

Clients can download these files before approving the estimate.

------------------------------------------------------------------------

# Database Architecture

## Table: document_files

Suggested fields:

  Field             Description
  ----------------- ---------------------
  id                uuid
  organization_id   organization
  resource_type     estimate or invoice
  resource_id       associated document
  file_name         original file name
  storage_key       file storage path
  mime_type         file type
  file_size         size in bytes
  is_public         visible to client
  uploaded_by       user id
  created_at        timestamp

------------------------------------------------------------------------

# File Storage

Files should be stored using object storage such as:

-   AWS S3
-   Cloudflare R2
-   MinIO
-   Supabase Storage

The database should store only the **file metadata and storage key**.

------------------------------------------------------------------------

# Security Considerations

Files must not be directly exposed through permanent public URLs.

Recommended approach:

Use **signed URLs** or a protected endpoint that validates the public
document token.

Example flow:

Client opens estimate link\
→ system validates token\
→ generates temporary file URL

This prevents unauthorized access.

------------------------------------------------------------------------

# User Interface

## Internal Panel

Inside the Estimate or Invoice page:

Section:

Attachments

Actions:

-   Upload file
-   Download file
-   Delete file
-   Toggle visibility (Internal / Client Visible)

Files marked as client visible should show a badge:

Client Visible

Internal files show:

Internal

------------------------------------------------------------------------

# Public Client Page

If attachments are marked as client visible, they appear in the public
document page.

Example section:

Attachments

-   Mockup-Front-Shirt.png
-   Design-Specifications.pdf

This allows the client to review supporting materials before approving
the estimate.

------------------------------------------------------------------------

# Business Benefits

Document attachments significantly improve the usability of the system
for industries such as:

-   custom manufacturing
-   print shops
-   apparel production
-   event planning
-   construction
-   design agencies
-   marketing services

Clients can review visuals and supporting materials directly in the
estimate.

------------------------------------------------------------------------

# Recommended Initial Scope

Initial implementation should include:

-   attachments on estimates
-   attachments on invoices
-   internal vs client visibility
-   file upload
-   file download
-   file deletion
-   optional settings control

Advanced features should be postponed.

------------------------------------------------------------------------

# Future Expansion

The system architecture should allow future improvements such as:

-   attachment versioning
-   client file uploads
-   comments on attachments
-   preview thumbnails
-   drag-and-drop uploads
-   document galleries

------------------------------------------------------------------------

# Summary

Document Attachments allow organizations to attach supporting materials
directly to estimates and invoices.

Key characteristics:

-   optional feature controlled by settings
-   internal and client-visible files
-   secure storage architecture
-   reusable for multiple document types

This feature enhances the client experience and improves document
clarity without increasing system complexity.
