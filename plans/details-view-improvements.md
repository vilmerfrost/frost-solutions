# Improvement Plan: Details Views

## 1. Objective
Enhance the "Details Views" (specifically Projects and Clients) to improve usability, visual consistency, and functionality. The goal is to make these pages more useful dashboards for their respective entities.

## 2. Current State Analysis

### Client Details (`/clients/[id]`)
*   **Pros:** Shows key stats (Revenue, Hours), lists projects and invoices.
*   **Cons:**
    *   Basic list views for projects/invoices (no sorting/filtering).
    *   Lack of content organization (everything stacked vertically).
    *   Limited "Quick Actions".
    *   Visual hierarchy could be improved.

### Project Details (`/projects/[id]`)
*   **Pros:** Feature-rich (Budget, Schedule, AI insights).
*   **Cons:**
    *   Cluttered interface due to many components stacked.
    *   Complex data fetching logic mixed with UI.
    *   Navigation and hierarchy are not distinct.
    *   Invoice creation flow is embedded and complex.

## 3. Proposed Architecture: `DetailLayout`

We will introduce a standardized layout pattern for all detail pages.

```tsx
<DetailLayout
  title="Project Name"
  subtitle="Client Name"
  status={<StatusBadge status="active" />}
  actions={
    <>
      <Button>Edit</Button>
      <Button>New Invoice</Button>
    </>
  }
  tabs={[
    { label: 'Overview', content: <OverviewTab /> },
    { label: 'Financials', content: <FinancialsTab /> },
    { label: 'Team', content: <TeamTab /> },
  ]}
/>
```

### Key Components
1.  **Header:** Consistent breadcrumbs, title, status, and primary actions.
2.  **Tabs:** To organize content and reduce scrolling.
3.  **Stats Row:** Key metrics at a glance (top of Overview tab).
4.  **Data Tables:** Sortable, filterable tables for related lists.

## 4. Specific Improvements

### A. Client Details Page
**Tabs:**
1.  **Overview:**
    *   Client Info Card (Contact details).
    *   Key Stats (Total Revenue, Active Projects, Outstanding Invoices).
    *   Recent Activity (Last 5 invoices, Active projects).
2.  **Projects:**
    *   Full sortable table of projects.
    *   Filters: Status (Active/Archived), Type.
3.  **Invoices:**
    *   Full sortable table of invoices.
    *   Filters: Status (Paid/Unpaid/Overdue).
4.  **Documents:** (Future) Uploaded contracts/files.

### B. Project Details Page
**Tabs:**
1.  **Overview:**
    *   Project Info (Address, Dates).
    *   Progress/Budget Card.
    *   Schedule/Timeline Preview.
2.  **Financials:**
    *   Budget vs Actuals.
    *   Invoices list.
    *   Expenses/Materials.
3.  **Time Entries:**
    *   Detailed log of hours.
    *   Filter by Employee, Date, Status (Billed/Unbilled).
4.  **Team:**
    *   Assigned employees.
    *   Resource planning.
5.  **Settings:**
    *   Edit Project.
    *   Archive/Delete.

## 5. Implementation Steps
1.  Create `DetailLayout` component.
2.  Refactor `ClientDetailPage` to use `DetailLayout`.
3.  Refactor `ProjectDetailPage` to use `DetailLayout`.
4.  Extract complex logic (like invoice creation) into custom hooks or separate components.
