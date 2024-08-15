# Unit Tests

The backend unit tests can be run in VSCode by going to `Terminal` -> `Run Task...` -> `Unit Tests - API`.

## Running on the Command Line

When working closely with the tests, it's often more efficient to run them on the command line. First move into the `app` directory.

To run all the tests and generate a coverage report:

```sh
npm run test
```

To run all the tests and skip the coverage report:

```sh
npm run test --coverage=false
```

To run one spec and skip the coverage report:

```sh
clear; npm run test -- --testPathPattern=tests/unit/forms/form/service.spec.js --coverage=false
```

To run a single group of tests within a spec, use the above command line to run the spec, and the `.only` modifier on the group of tests:

```javascript
describe.only('my tests', () => {
  test('something', () => {
    // Test something
  });

  test('something else', () => {
    // Test something else
  });
});
```

To run a single test within a spec, use the above command line to run the spec, and the `.only` modifier on the test:

```javascript
describe('my tests', () => {
  test('something', () => {
    // Test something
  });

  test.only('something else', () => {
    // Test something else
  });
});
```

Similar to `.only` is the `.skip` modifier to skip a test or group of tests.

## Testing Strategy

The testing strategy for the backend unit tests can be broken down into the different layers of the backend. For all tests we should:

- ensure that the tests are consistent
- ensure that we have 100% test coverage
- ensure that we have complete test coverage: we should be testing additional corner cases even once we reach 100% test coverage
- test the interface, not the implementation
- test the unit under test, not its dependencies

### Middleware Testing

The tests for the middleware files should:

- mock all services calls used by the middleware, including both exception and minimal valid results
- test all response codes produced by the middleware

### Route Testing

The tests for the `route.js` files should:

- mock all middleware used by the file
- each route test should check that every middleware is called the proper number of times
- each route test should mock the controller function that it calls
- mock controller functions with `res.sendStatus(200)`, as doing something like `next()` will call multiple controller functions when route paths are overloaded
- check that the mocked controller function is called - this will catch when a new route path accidentally overloads an old one
- for consistency and ease of comparison, alphabetize the expect clauses ("alphabetize when possible")

Note:

- Some middleware is called when the `routes.js` is loaded, not when the route is called. For example, the parameters to `userAccess.hasFormPermissions` cannot be tested by calling the route using it. Even if we reload the `routes.js` for each route test, it would be hard to tell which call to `hasFormPermissions` was the call for the route under test
- Maybe we should refactor and create a set of standard middleware mocks that live outside the `routes.spec.js` files
