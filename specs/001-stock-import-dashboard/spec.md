# Feature Specification: Stock Import & Client Dashboard

**Feature Branch**: `001-stock-import-dashboard`  
**Created**: 2026-05-19  
**Status**: Draft  
**Input**: User description: "Construir a funcionalidade base do Prudens Index: um sistema que recebe uma planilha Excel enviada pelo admin da Prudens, processa os dados de estoque e apresenta ao usuário cliente um dashboard com os valores organizados por produto e filial."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Admin imports client stock file (Priority: P1)

As a Prudens admin, I sign in to the restricted admin area, select a specific client,
upload a stock spreadsheet (.xlsx or .csv), and follow processing status until the
import completes or fails. I receive clear feedback at each stage so I know whether
the client's data is ready for viewing.

**Why this priority**: Without a validated import pipeline, no client dashboard can
show real stock intelligence. This is the data foundation for the entire product.

**Independent Test**: An admin can upload a valid template file for Client A, observe
status transitions (queued → processing → completed), and confirm the import is
recorded for Client A—without using the client dashboard.

**Acceptance Scenarios**:

1. **Given** an authenticated Prudens admin and a valid stock file for Client A,
   **When** the admin uploads the file and assigns it to Client A,
   **Then** the system accepts the file, enqueues asynchronous processing, and
   shows a trackable status until completion.

2. **Given** an authenticated Prudens admin and a file with wrong structure or
   unsupported format,
   **When** the admin attempts upload,
   **Then** the system rejects the file before processing starts and displays a
   clear, actionable error message (missing columns, wrong types, invalid extension).

3. **Given** a completed import for Client A,
   **When** the admin views import history or status for Client A,
   **Then** the system shows that data is available for the client dashboard.

4. **Given** an authenticated client user (non-admin),
   **When** they attempt to access the admin upload area,
   **Then** access is denied.

---

### User Story 2 - Client views stock dashboard (Priority: P2)

As a client user (business owner or operational team member), I sign in to the
client area and see a responsive dashboard of my organization's processed stock:
products with per-branch indices, stock values, item status, summary indicators, and
a distribution view by branch.

**Why this priority**: This delivers the core product value—operational stock
intelligence—after data has been imported.

**Independent Test**: With preloaded processed data for Client B, a Client B user
opens the dashboard and sees only Client B's products, branches, and summary metrics—
without using the admin upload flow in the same session.

**Acceptance Scenarios**:

1. **Given** a successful import exists for Client B and a authenticated Client B
   user,
   **When** they open the dashboard,
   **Then** they see a product table with branch-level indices, stock values, item
   status, summary indicators, and a branch distribution visualization.

2. **Given** no successful import yet for the client,
   **When** the client user opens the dashboard,
   **Then** the system shows an empty state explaining that data is not yet available.

3. **Given** processed data for Client A and Client B,
   **When** a Client A user views the dashboard,
   **Then** only Client A data is visible (no products, branches, or metrics from
   Client B).

4. **Given** a dashboard with up to 5,000 product rows,
   **When** the client user opens it,
   **Then** the primary dashboard content becomes interactive within 3 seconds.

---

### User Story 3 - Client filters and exports report (Priority: P3)

As a client user, I filter the dashboard by branch, product category, and item
status to focus on what matters, and I export the currently displayed view as a PDF
report for sharing or offline review.

**Why this priority**: Filtering and export increase day-to-day usability but depend
on the dashboard from User Story 2.

**Independent Test**: On a populated dashboard, apply each filter type, confirm the
view updates instantly, export PDF, and verify the PDF reflects filtered content.

**Acceptance Scenarios**:

1. **Given** a loaded dashboard with multiple branches, categories, and statuses,
   **When** the client selects one or more filter values,
   **Then** the table, charts, and summary indicators update to match the selection
   within 500 milliseconds without a full page reload.

2. **Given** an active filter selection,
   **When** the client requests PDF export,
   **Then** the system generates a PDF containing the same products, metrics, and
   filters currently shown on screen.

3. **Given** filters that match zero products,
   **When** the client views the dashboard,
   **Then** the system shows an empty filtered state with option to clear filters.

---

### Edge Cases

- Upload interrupted mid-transfer (network drop): user sees failed upload status and
  can retry without corrupting prior successful imports.
- Duplicate upload for the same client while a previous job is still processing:
  system queues or rejects according to a single in-flight rule and communicates
  clearly which file is being processed.
- Spreadsheet with valid structure but empty data rows: rejected before processing
  with a clear message.
- Spreadsheet exceeding agreed size/row limits: rejected at validation with guidance
  on limits (limits defined in implementation plan).
- Partial processing failure after validation: job marked failed; client dashboard
  continues to show last successful import; admin sees failure reason.
- Client session expires while viewing dashboard: user is redirected to sign-in;
  no data exposed without authentication.
- Admin uploads file for wrong client: admin can correct by uploading to the
  intended client; client isolation prevents cross-client visibility.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide two distinct access profiles—Prudens admin and
  client—with separate restricted areas and navigation.
- **FR-002**: System MUST require authentication for every application route; unauthenticated
  users MUST NOT access admin or client functionality.
- **FR-003**: Prudens admin MUST be able to upload stock files in `.xlsx` or `.csv`
  format for a selected client account.
- **FR-004**: System MUST validate file format and required spreadsheet structure
  before starting asynchronous processing; invalid files MUST NOT enter the processing
  queue.
- **FR-005**: System MUST process valid uploads asynchronously and expose processing
  status (e.g., queued, processing, completed, failed) to the admin until a terminal
  state is reached.
- **FR-006**: System MUST persist extracted stock records linked exclusively to the
  target client account identified at upload time.
- **FR-007**: System MUST notify or surface to the admin when processed data is
  available for the client dashboard (and when processing fails).
- **FR-008**: Client users MUST view a responsive dashboard showing products with
  per-branch indices, stock values, item status, summary indicators, and branch
  distribution visualization.
- **FR-009**: Client users MUST filter the dashboard by branch, product category,
  and item status; filter changes MUST update the visible table, charts, and summaries
  consistently.
- **FR-010**: Client users MUST export the currently filtered dashboard view as PDF.
- **FR-011**: System MUST enforce tenant isolation: data imported for one client
  MUST NEVER be visible to users of another client, including in lists, dashboards,
  exports, and status views.
- **FR-012**: System MUST retain and display the most recent successful import per
  client on the dashboard until superseded by a newer successful import.

### Key Entities

- **Client (tenant)**: Organization whose stock is managed; owns users and imported
  datasets; isolation boundary for all stock data.
- **User**: Authenticated person with role Admin (Prudens) or Client; belongs to at
  most one client account for client role.
- **Import job**: Represents one uploaded file, target client, status lifecycle,
  timestamps, and error details when failed.
- **Product (stock line)**: Item from spreadsheet with identifier, name, category,
  and attributes needed for dashboard display.
- **Branch**: Store or location dimension; products carry per-branch index and stock
  values.
- **Item status**: Operational situation of a product line (e.g., adequate, critical,
  excess—exact labels aligned to spreadsheet template).
- **Dashboard snapshot**: Set of products and aggregates derived from one successful
  import, used as the client's current view.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: For a valid spreadsheet within standard size limits, data appears on
  the target client's dashboard within 60 seconds of admin upload completion
  (upload finished and processing started).
- **SC-002**: With up to 5,000 product rows in the current snapshot, the client
  dashboard reaches an interactive state (table and primary indicators usable) within
  3 seconds on a typical business network connection.
- **SC-003**: Applying or changing any dashboard filter updates the visible data
  within 500 milliseconds without requiring the user to wait for a new full data load
  from the server.
- **SC-004**: 100% of structurally invalid or wrong-format uploads are rejected before
  processing begins, with an error message that identifies the problem class (format,
  missing columns, empty data, or invalid values).
- **SC-005**: In isolation tests across at least two client accounts, zero instances
  of cross-client data appear in dashboard, export, or admin client-scoped views.
- **SC-006**: 95% of admin users successfully complete a first valid upload without
  support intervention, measured in pilot onboarding.

## Assumptions

- A canonical spreadsheet template (column names, types, and required sheets) will
  be defined during technical planning; this feature depends on that template for
  structure validation.
- Client and admin users are provisioned ahead of time (this feature does not include
  self-service registration or billing).
- Authentication uses industry-standard credential-based sign-in (email and password
  or equivalent); specific identity provider choices are out of scope for this spec.
- Each new successful import replaces the dashboard snapshot shown to the client;
  historical imports remain visible to admin for audit but not as parallel client views.
- Standard web application availability applies; offline mode is out of scope.
- PDF export includes table and summary content visible under current filters; highly
  customized branding is out of scope for the base feature.
- Row and file size limits will be set in planning to meet the 60-second processing
  and 3-second dashboard goals; defaults assume files typical of mid-size retail
  operations (up to 5,000 product rows per import).
