# Code Coverage Notes

## Run coverage

```bash
yarn test:coverage
```

## Why 100% coverage does not mean the app is fully tested

- Coverage only shows which lines were executed, not whether all behaviors are validated.
- A line can run with one input while edge cases and invalid paths stay untested.
- External integrations (network, browser behavior, deployment config) can still fail even with high unit/integration coverage.
- Functional quality also depends on real user flows (E2E), non-functional checks, and data scenarios not captured by line coverage.
