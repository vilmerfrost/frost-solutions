# Frost Solutions V2.0 - Binder (DMS) Specification

## Overview
This document outlines the technical specification for the **Binder** feature (Document Management System) in Frost Solutions V2.0. The goal is to replace external services like iBinder by providing a robust, construction-specific file management system.

## 1. Folder Structure
The system will initialize new projects with a standardized folder structure based on Swedish construction industry standards (simplified BSAB/CoClass), ensuring consistency across projects.

### Default Structure
*   **01-Ritningar** (Drawings)
    *   01-A (Arkitekt)
    *   02-K (Konstruktion)
    *   03-E (El)
    *   04-VS (Ventilation & Sanitet)
*   **02-Beskrivningar** (Specifications)
    *   01-Tekniska Beskrivningar
    *   02-Rumsbeskrivningar
*   **03-Administrativt** (Admin)
    *   01-Myndighetsbeslut (Building permits, etc.)
    *   02-Mötesprotokoll
    *   03-Tidplaner
*   **04-Avtal** (Contracts)
    *   *Restricted Access*
*   **05-Ekonomi** (Finance)
    *   *Restricted Access*
*   **06-Foton** (Photos)
    *   01-Före etablering
    *   02-Under produktion
    *   03-Färdigställande
*   **07-KMA** (Quality, Environment, Work Environment)
    *   01-Riskanalyser
    *   02-Egenkontroller
    *   03-Säkerhetsdatablad

### Customization
*   Admins can add, rename, or delete folders from the default template.
*   "Project Templates" can be saved to define different folder structures for different types of jobs (e.g., "Small Service Job" vs "New Construction").

## 2. Permissions (RBAC)
Access control is critical. We distinguish between **Internal Users** (Employees) and **External Users** (Subcontractors, Clients).

### Roles & Access Levels

| Role | Access Level | Description |
| :--- | :--- | :--- |
| **Admin / Project Manager** | **Full Access** | Read, Write, Delete, Manage Permissions, Restore Versions. |
| **Site Supervisor** | **Read/Write** | Can upload and edit files in all folders except *04-Avtal* and *05-Ekonomi*. |
| **Worker (Internal)** | **Read-Only (mostly)** | Can view Drawings and KMA. Can upload to *06-Foton*. |
| **Subcontractor (External)** | **Restricted** | **View:** *01-Ritningar*, *02-Beskrivningar*. <br> **Upload:** Only to specific "Inlämning" (Submittals) folders. |
| **Client / Guest** | **View-Only** | Specific folders only (e.g., *03-Mötesprotokoll*, *06-Foton*). |

### Implementation Details
*   Permissions are inherited from parent folders but can be overridden at the subfolder level.
*   "Hidden" folders for sensitive data (Contracts, Budget).

## 3. Versioning
The system must handle file updates gracefully, ensuring everyone works from the latest drawing version.

*   **Automatic Versioning:** When a file with the same name is uploaded to a folder, the system automatically:
    1.  Archives the existing file as `v1`.
    2.  Sets the new file as `Current` (`v2`).
    3.  Increments the version number.
*   **Version History:**
    *   Right-click > "Version History" shows a list of all previous versions.
    *   Metadata: *Uploaded by*, *Date*, *Comment*.
    *   Action: "Restore" or "Download" old versions.
*   **Notifications:**
    *   Option to "Notify Project Members" when a critical drawing is updated.

## 4. Sharing
External sharing allows access without requiring a full user account.

*   **Public Links:**
    *   Generate a unique URL for a folder or file.
    *   **Expiration:** Set an expiry date (e.g., 7 days, 30 days, Never).
    *   **Password:** Optional password protection.
*   **QR Codes:**
    *   Generate a QR code for a specific folder (e.g., "Ritningar") to be printed and posted on the construction site. Scanning it opens the folder in a mobile web view.

## 5. UI/UX
The interface should be familiar to users of Windows Explorer or macOS Finder but optimized for web.

### Desktop View
*   **Layout:** Two-pane layout.
    *   **Left Sidebar:** Tree view of the folder structure. Collapsible.
    *   **Main Area:** Grid or List view of files.
*   **List View Columns:** Name, Status (Draft/Approved), Version, Size, Modified Date, Modified By.
*   **Preview Pane:** (Optional toggle) Shows a preview of the selected PDF/Image on the right.

### Mobile View
*   **Navigation:** Breadcrumb-based navigation.
    *   *Projects > Project A > 01-Ritningar > 01-A*
*   **Focus:** Optimized for quickly finding and viewing PDFs.
*   **Upload:** prominent "Camera" button to quickly snap and upload photos to the current folder.

### Interactions
*   **Drag & Drop:** Upload files by dragging them into the browser. Move files between folders.
*   **Context Menu:** Right-click for actions: Rename, Move, Copy, Share, Version History, Delete.
*   **Search:** Global search within the project (filename and metadata).

## 6. Technical Considerations
*   **Storage:** S3-compatible storage (AWS S3 or similar).
*   **PDF Rendering:** High-performance PDF viewer (e.g., PDF.js or commercial library) for handling large construction drawings.
*   **Offline Support:** (Future) Cache frequently used folders for offline access on mobile.
