# Backend API

This is the source code for the Express API. It contains all routes (endpoints) needed to run the application.

## Design

The code is broken down into layers:

- The `middleware` layer provides a collection of utility functions that validate requests, check permissions, etc.
- The `route` layer uses `middleware` to validate requests and check permissions, and then performs work by calling a `controller`
- The `controller` layer deals with HTTP requests and responses, and performs work by calling a `service`
- The `service` layer contains business logic and manipulates data by calling the `model`
- The `model` layer is the ORM that deals with the database

> Note: Between the `controller` and `service` there is a logical division where nothing below the `controller` knows about requests and responses, and nothing above the `service` touches the `model`.

### Middleware

Express middleware always has to call `next`, otherwise the request hangs.

- when called as `next()` it chains to the next piece of middleware
- when called as `next(obj)` execution jumps to the error handler with `obj` as the error object

We wrap middleware in a `try`/`catch` to make it obvious that `next` is always called:

```javascript
const middleware = async (req, _res, next) => {
  try {
    // If possible the helper functions should throw a Problem rather than
    // return a response that needs handling logic.
    const formId = _getValidFormId(req);
    const foo = service.getForm(formId);

    next();
  } catch (error) {
    next(error);
  }
};
```

#### Testing

Testing the middleware should include but is not limited to:

- TODO

### Routes

Sets up routes with Middleware and then calls a Controller.

#### Testing

Testing the routes should include but is not limited to:

- TODO

### Controllers

Calls Services

### Services

Calls ORM

### ORM

Calls DB
