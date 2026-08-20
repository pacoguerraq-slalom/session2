# TODO Application Coding Guidelines

## Formatting and Imports

Use consistent formatting across the codebase and follow the project's ESLint and Prettier configurations. Organize imports into logical groups: external libraries first, internal modules next, and local files last. This makes dependencies easier to scan and keeps files consistent.

## Naming and Organization

Use meaningful and descriptive names for variables, functions, components, and files. Names should communicate intent without requiring extra explanation. Follow established project patterns and best practices so new code fits naturally with the rest of the codebase.

## Code Structure and Reuse

Follow the DRY (Don't Repeat Yourself) principle and avoid duplicated code. Write clean, readable, and maintainable code with clear separation of concerns. Prefer small, reusable functions and React components that each have a focused responsibility.

Use TypeScript types and interfaces where appropriate to make contracts explicit and improve the reliability and maintainability of the code.

## Error Handling and Cleanup

Handle errors gracefully and avoid silent failures. Errors should be reported or handled in a way that helps users and developers understand what went wrong. Remove unused code, imports, and dependencies so the codebase remains focused and easy to maintain.

Add comments only when necessary to explain complex logic that is not clear from the code itself. Avoid comments that merely restate what the code does.

## Quality Checks

Before committing code, ensure it passes linting and testing. Every change should preserve existing behavior unless a deliberate change is required, and every new feature should follow the project's testing standards.

Consistent application of these guidelines helps maintain a coherent, high-quality codebase as the TODO application grows.
