# TODO Application Implementation Plan

## 1. Goal and Scope

Expand the current React and Express starter application into a persistent TODO application. The finished application will let users manage tasks, track completion, assign due dates and priorities, filter and sort the task list, and return to the same task data after reopening the application.

The plan follows the project guidance in `.github/copilot-instructions.md` and its linked functional, UI, testing, and coding guidelines.

## 2. Functional Summary

The application must support the following user capabilities:

- Create, edit, and delete tasks.
- Mark tasks as completed or incomplete.
- Assign a due date to each task.
- Sort tasks by due date, with the nearest due dates first.
- Set each task's priority to High, Medium, or Low.
- Filter tasks by completion status and priority.
- Save task data so it remains available when the application is reopened.

### Recommended Task Model

Use one shared task shape across the API, persistence layer, and frontend:

- `id`: stable unique identifier.
- `title`: required, non-empty task text.
- `completed`: boolean completion state.
- `dueDate`: date value or an explicit null value when no date is assigned.
- `priority`: one of `High`, `Medium`, or `Low`.
- `createdAt` and `updatedAt`: timestamps for ordering and maintenance.

## 3. Delivery Priorities and Dependencies

### Priority Levels

- **P0 - Foundation:** persistence, task model, API contract, and application shell. These are required before feature work can be reliable.
- **P1 - Core workflow:** create, read, edit, delete, and completion state. These provide the minimum useful TODO experience.
- **P2 - Organization:** due dates, priority, sorting, and filters.
- **P3 - Quality and release readiness:** accessibility, responsive refinement, error states, automated coverage, and final validation.

### Dependency Order

1. Establish the persistent data model and API contract.
2. Replace sample items with task records and implement backend CRUD behavior.
3. Build the frontend task state and core task workflow.
4. Add due dates, priorities, sorting, and filtering to the API and UI.
5. Apply the Material Design visual system and responsive/accessibility refinements.
6. Complete unit, integration, and E2E coverage, then run linting, builds, and regression checks.

## 4. Phase 0: Project Foundation

**Milestone:** The application has a documented task contract, stable local configuration, and a testable development baseline.

### Backend Tasks

- Replace the `items` terminology with task-oriented domain names in routes, handlers, queries, and responses.
- Move database initialization and task operations into small, focused modules with clear separation of concerns.
- Replace the in-memory SQLite database with a file-backed SQLite database so data survives server restarts and application reopening.
- Add a schema or migration step for the task fields and indexes needed for due-date and priority queries.
- Keep the backend port configurable with `const PORT = process.env.PORT || 3030;`.
- Define validation and error response conventions for malformed task data, invalid IDs, and missing records.

### Frontend Tasks

- Establish a task-oriented component structure, separating data access, state management, forms, list rendering, and task-row actions.
- Keep the frontend default port at `3000` and allow it to be overridden through the `PORT` environment variable.
- Decide whether the existing `fetch` usage or the installed Axios dependency will be the single API client approach, then remove unused dependencies.
- Confirm the development proxy continues to target the backend port.

### Testing Tasks

- Preserve and stabilize the existing backend and frontend test setup before adding new behavior.
- Add tests for task validation and pure task transformation helpers as the first unit-test baseline.
- Add setup and teardown hooks so each test has isolated database and mock state.

### Dependencies

This phase blocks all feature phases. The API contract and persistent schema must be agreed before frontend task forms and list components are implemented.

## 5. Phase 1: Core Task Workflow

**Milestone:** A user can manage the complete basic lifecycle of a task.

### Backend Tasks

- Implement `GET /api/tasks` to return persisted tasks.
- Implement `POST /api/tasks` with required title validation and sensible defaults for completion, due date, and priority.
- Implement `PATCH /api/tasks/:id` for editing title, completion state, due date, and priority.
- Implement `DELETE /api/tasks/:id` with clear success and not-found responses.
- Return consistent JSON response shapes and actionable error messages.
- Handle database and request errors without silent failures or leaking implementation details.

### Frontend Tasks

- Build a Material Design application shell with a clear title, task entry area, task list, and feedback region.
- Add a create-task form with accessible labels, validation, loading state, and successful reset behavior.
- Render tasks with reusable task-row components.
- Add edit and delete actions with confirmation or an equivalent protection against accidental deletion.
- Add a completion control that supports both completed and incomplete states.
- Display loading, empty, validation, network-error, and successful-action states.
- Use meaningful component and handler names, grouped imports, and small reusable functions.

### Testing Tasks

- **Backend unit tests:** test validation, default values, update behavior, and error mapping in `packages/backend/__tests__/`.
- **Backend integration tests:** use Jest and Supertest in `packages/backend/__tests__/integration/` to cover task creation, retrieval, editing, completion changes, deletion, invalid input, and missing IDs.
- **Frontend unit tests:** in `packages/frontend/src/__tests__/`, verify form submission, task rendering, edit flow, delete flow, completion toggling, loading states, and visible error handling.
- **E2E candidate:** add a critical create-edit-complete-delete workflow using Playwright, one browser, and the Page Object Model.

### Dependencies

Phase 1 depends on Phase 0 and is the prerequisite for due-date, priority, and filter behavior because those features extend the same task contract and list interactions.

## 6. Phase 2: Task Organization

**Milestone:** Users can schedule, prioritize, sort, and narrow the task list.

### Backend Tasks

- Extend create and update validation for due dates and the exact priority values `High`, `Medium`, and `Low`.
- Decide and document the date format used by the API, preferably an unambiguous ISO date representation.
- Update `GET /api/tasks` to sort by nearest due date first, with a documented rule for tasks without due dates and deterministic tie-breaking.
- Add query parameters for status and priority filtering, such as `status=completed|incomplete` and `priority=High|Medium|Low`.
- Validate filter values and return clear client errors for unsupported values.
- Add indexes or query improvements if the persisted task set grows beyond the initial scale.

### Frontend Tasks

- Extend the create and edit forms with a date input and Material Design priority control.
- Add visible priority and due-date information to each task without relying on color alone.
- Add status and priority filters with an explicit clear/reset option.
- Reflect server-defined due-date ordering in the UI and keep filter changes predictable.
- Show useful empty states when filters produce no matches.
- Keep controls usable on phones, tablets, and desktops without horizontal scrolling.

### Testing Tasks

- **Backend unit tests:** cover date parsing, priority validation, sorting rules, no-date handling, and filter composition.
- **Backend integration tests:** verify create/update persistence for due dates and priorities, nearest-due-date ordering, status filters, priority filters, combined filters, invalid filters, and empty results.
- **Frontend unit tests:** verify date and priority form values, filter changes, sort display, reset behavior, and no-match messaging.
- **E2E workflow:** cover creating tasks with different due dates and priorities, applying status and priority filters, and confirming the displayed order.

### Dependencies

Phase 2 depends on the stable task CRUD contract from Phase 1. Sorting and filtering should be implemented in the backend contract first, then represented by frontend controls so behavior remains consistent across clients.

## 7. Phase 3: UI, Accessibility, and Responsive Quality

**Milestone:** The complete workflow is clear, accessible, and usable across supported screen sizes.

### UI Tasks

- Use Material Design components for forms, buttons, inputs, selects, feedback, and layout where suitable.
- Apply a primary blue, secondary green, and neutral gray background palette.
- Use clear typography with a consistent hierarchy for titles, sections, labels, and task content.
- Use rounded buttons with visible hover and focus states.
- Maintain high contrast for text and controls.
- Keep task status and priority understandable without color alone by using text, icons with accessible names, or other redundant cues.
- Use responsive layout rules for phones, tablets, and desktops, with stable control sizing and no horizontal scrolling.

### Accessibility Tasks

- Provide semantic headings, labels, lists, buttons, and form relationships.
- Ensure every interactive control is reachable and operable by keyboard in a logical order.
- Make focus indicators clearly visible and never remove them without an accessible replacement.
- Provide screen reader names and state announcements for completion controls, edit/delete actions, filters, validation errors, and save failures.
- Ensure dialogs, confirmations, and dynamic feedback manage focus appropriately.

### Testing Tasks

- Add frontend tests that query controls by accessible role, label, and name rather than implementation details.
- Add keyboard interaction tests for task creation, editing, completion, filtering, and deletion.
- Run a manual or automated accessibility check for contrast, focus visibility, labels, and semantic structure.
- Run Playwright E2E checks at phone, tablet, and desktop viewport sizes for the critical workflows.
- Keep E2E coverage to 5-8 independent critical user journeys and use one browser only.

### Dependencies

This phase can begin during Phases 1 and 2, but final visual and accessibility validation depends on the complete task workflow and all controls being present.

## 8. Phase 4: Persistence, Reliability, and Release Readiness

**Milestone:** The application is reliable across restarts and ready for repeatable delivery.

### Backend Tasks

- Verify the database file location and lifecycle are suitable for local development and test isolation.
- Add startup handling for schema creation or migrations and clear logging for initialization failures.
- Add graceful handling for persistence failures, malformed requests, and unavailable resources.
- Confirm task data remains available after closing and reopening the application.
- Review API responses for consistency and remove leftover sample-item code.

### Frontend Tasks

- Verify the frontend reloads persisted tasks from the API rather than relying on stale in-memory state.
- Add retry or recovery guidance for failed loads and saves.
- Ensure controls are disabled or clearly state their progress during in-flight operations to prevent duplicate requests.
- Remove unused code, imports, styles, and dependencies after the feature work is complete.

### Testing Tasks

- **Persistence integration test:** create or update tasks, recreate the application/database connection as appropriate, and verify the records remain available.
- **Frontend unit tests:** verify failed loads and saves display useful feedback and recover correctly.
- **E2E persistence workflow:** create a task, reload or reopen the application, and confirm the task and its fields remain visible.
- Run the complete unit and integration suites, the selected Playwright suite, linting, and the production frontend build.
- Confirm all tests are isolated, independent, repeatable, and reliable across multiple runs.

### Dependencies

This phase depends on all feature behavior being implemented. It is the final release gate, although persistence tests should be added as soon as the file-backed database exists.

## 9. Milestone-Based Test Matrix

| Milestone | Primary validation | Required coverage |
| --- | --- | --- |
| Foundation ready | Unit tests and startup checks | Task validation, schema setup, isolated database state, port defaults |
| Core workflow ready | Jest and Supertest integration suite | Create, read, edit, complete/incomplete, delete, invalid input, not found |
| Organization ready | API integration plus frontend unit tests | Due dates, priorities, sorting, status filters, priority filters, combined filters |
| UI quality ready | Frontend accessibility tests and Playwright | Keyboard use, screen readers, focus, contrast, responsive layouts, critical workflows |
| Release ready | Full test, lint, build, and persistence run | Restart persistence, error recovery, clean dependency graph, repeatability |

## 10. Major Feature Acceptance Criteria

### Task Lifecycle

- **Acceptance criteria:** A user can create a task with a required title, see it in the task list, edit its title, and delete it after confirmation. Invalid titles are rejected with visible feedback.
- **Testing strategy:** Use backend unit tests for validation, Supertest integration tests for create/update/delete responses and not-found handling, frontend tests for form and dialog behavior, and one Playwright workflow covering the complete lifecycle.

### Completion State

- **Acceptance criteria:** Each task exposes a labeled completion control. Toggling it changes the task between completed and incomplete, persists the state, and communicates the state without relying on color alone.
- **Testing strategy:** Test boolean validation and PATCH behavior in backend tests, accessible checkbox interaction in frontend tests, and verify the checked state after a page reload in E2E coverage.

### Due Dates and Ordering

- **Acceptance criteria:** A task can have a valid `YYYY-MM-DD` due date or no due date. Tasks with dates appear from nearest to latest, and the documented no-date rule is applied consistently.
- **Testing strategy:** Unit-test date validation and ordering, integration-test multiple dates and no-date tasks, frontend-test date entry and display, and include ordering in the organization E2E journey.

### Priorities and Filters

- **Acceptance criteria:** Users can assign only High, Medium, or Low priority and filter by priority, completion status, or both. Clearing filters restores the complete sorted list, including a clear no-results state.
- **Testing strategy:** Test allowed values and combined query parameters through Jest and Supertest, test filter controls and empty states with React Testing Library, and verify a combined filter workflow with Playwright.

### Persistence and Recovery

- **Acceptance criteria:** Tasks and all supported fields remain available after the application or server is reopened. Load and save failures provide visible, actionable feedback and never fail silently.
- **Testing strategy:** Use a persistence integration test against the file-backed database, frontend tests for failed requests and recovery states, and an E2E reload/reopen workflow.

### UI, Accessibility, and Responsiveness

- **Acceptance criteria:** The interface uses Material Design components, the primary blue/secondary green/neutral gray palette, consistent typography, rounded buttons, visible hover/focus states, semantic labels, keyboard navigation, screen reader names, high contrast, and layouts that work on phone, tablet, and desktop widths without horizontal scrolling.
- **Testing strategy:** Query frontend behavior by accessible roles and names, test keyboard paths and focus-visible states, perform accessibility and contrast checks, and run the critical Playwright journeys at representative viewport sizes.

## 11. Definition of Done

A feature is complete only when:

- Its API, persistence, and frontend behavior are implemented with clear separation of concerns.
- It follows the Material Design, color, typography, responsive, and accessibility guidelines.
- Names, imports, formatting, and component boundaries follow the coding guidelines.
- Appropriate unit, integration, and E2E tests are present in the required locations and naming conventions.
- Error and empty states are visible and actionable rather than silently ignored.
- The feature passes linting, tests, and the frontend production build.
- No unused code, imports, or dependencies remain from the implementation.
- The implementation preserves established project patterns and is ready for review.

## 12. Recommended Implementation Sequence

1. Agree on the task schema, API response contract, date format, filter vocabulary, and no-due-date sorting rule.
2. Introduce file-backed persistence and isolated database setup for tests.
3. Implement and test task retrieval and creation.
4. Implement and test editing, completion toggling, and deletion.
5. Build the reusable frontend task list and core workflow against the API.
6. Add due dates and priorities end to end.
7. Add backend sorting and filters, then connect frontend filter controls.
8. Apply final Material Design, responsive, keyboard, screen reader, and contrast refinements.
9. Add the remaining critical Playwright journeys and persistence coverage.
10. Run the full quality gate: lint, unit tests, integration tests, E2E tests, build, and manual responsive/accessibility review.
