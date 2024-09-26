# Unit Tests

The backend unit tests are run in VSCode by going to `Terminal` -> `Run Task...` -> `Unit Tests - API`. Once the tests complete, the backend code coverage report is in `/app/coverage/lcov-report/index.html`.

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

The testing strategy for the backend unit tests can be broken down into the different layers of the backend. For all tests:

- Ensure that the tests are consistent: be sure to completely understand similar tests before creating a new test
- Ensure that we have 100% test coverage
- Ensure that we have complete test coverage: we should be testing additional corner cases even once we reach 100% test coverage
- Test the interface, not the implementation
- Test the unit under test, not its dependencies

### Middleware Testing

The tests for the middleware files:

- Mock all services calls used by the middleware, including both exception and minimal valid results
- Test all response codes produced by the middleware

### Route Testing

The tests for the `route.js` files:

- Mock middleware used by the file
- Each route test mocks its controller function with `res.sendStatus(200)`, as doing something like `next()` calls multiple controller functions when route paths are overloaded
- Check that the route calls every middleware the proper number of times - should be 0 or 1
- Check that the route calls the expected controller function - this will catch when a new route path accidentally overloads an old one
- Alphabetize the expect clauses ("alphabetize when possible") for consistency and ease of comparison

Note:

- The order that middleware is called is very important, but we are not testing this. Perhaps integration tests are the best solution for this
- Some middleware takes parameters and is created when a route is created. This means that, for example, the parameters to `jwtService.protect` or `userAccess.hasFormPermissions` cannot be tested by calling the route using it. Even if we reload the `routes.js` for each route test, it would be hard to tell which call to create the middleware was the call for the route under test
- Maybe we should refactor and create a set of standard middleware mocks that live outside the `routes.spec.js` files
