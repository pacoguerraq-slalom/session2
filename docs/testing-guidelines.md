# TODO Application Testing Guidelines

## Unit Tests

- Use Jest for unit testing functions and React components.
- Use the naming convention `*.test.js` or `*.test.ts`.
- Place backend unit tests in `packages/backend/__tests__/`.
- Place frontend unit tests in `packages/frontend/src/__tests__/`.
- Name test files to match what they are testing.

## Integration Tests

- Use Jest and Supertest for backend API integration tests.
- Place integration tests in `packages/backend/__tests__/integration/`.
- Use the naming convention `*.test.js` or `*.test.ts`.
- Name files based on the feature or API being tested.

## End-to-End (E2E) Tests

- Use Playwright for E2E testing.
- Place E2E tests in `tests/e2e/`.
- Use the naming convention `*.spec.js` or `*.spec.ts`.
- Name files based on the user workflow being tested.
- Use only one browser.
- Follow the Page Object Model (POM) pattern.
- Limit E2E coverage to 5-8 critical user journeys.

## Port Configuration

- Use environment variables with sensible defaults.
- Configure the backend port with `const PORT = process.env.PORT || 3030;`.
- Configure the frontend to default to port `3000` and allow overriding it with the `PORT` environment variable.

## General Testing Principles

- All tests must be isolated and independent.
- Use setup and teardown hooks.
- Tests must be repeatable and reliable across multiple runs.
- Every new feature should include appropriate tests.
- Tests should be maintainable and follow industry best practices.
