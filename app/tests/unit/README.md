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
