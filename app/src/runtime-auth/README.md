# Runtime Auth Security Middleware

The security middleware handles authentication, authorization, and resource resolution for CHEFS routes. It's the piece that sits between your Express routes and your controllers, making sure users have the right permissions before they can access anything.

## Quick Start

Most of the time, you'll use the pre-configured CHEFS security instance:

```javascript
const chefSecurity = require('../../runtime-auth/security').createCHEFSSecurity({
  baseUrl: config.get('server.basePath')
});

// Then in your routes:
routes.get('/:formId', chefSecurity.inline({
  allowedAuth: ['userOidc', 'apiKeyBasic'],
  requiredPermissions: [Permissions.FORM_READ]
}), controller.read);
```

That's it. The middleware handles the rest—authenticating the request, resolving the form resource, checking permissions, and attaching everything to `req.securityContext` before your controller runs.

## Default Behavior

By default, `chefsSecurity` comes pre-wired with all the CHEFS services you need:

- `authService` - User and API key authentication
- `formService` - Form lookups
- `submissionService` - Submission lookups  
- `fileService` - File lookups
- `rbacService` - Permission checks
- `jwtService` - Token validation
- `gatewayService` - Gateway token validation

When you don't specify `allowedAuth`, it defaults to trying non-public strategies in order: `userOidc`, `apiKeyBasic`, then `gatewayBearer`. Public access is opt-in only.

The middleware also auto-infers a few things:

- **Classification**: Guessed from the URL path (e.g., `/api/v1/forms` becomes `api`)
- **Resource type**: Inferred from route params (e.g., `:formId` → `formOnly`, `:submissionId` → `submissionFromForm`)
- **Route pattern**: Uses Express's `req.route.path` if available, falls back to `req.path`

You can override any of these behaviors.

## Two Approaches: Inline vs Centralized

There are two ways to define security policies: inline (per-route) or centralized (pattern matching).

### Inline Policies

Inline policies are defined right where you use them. This is what you'll see in the webcomponents routes:

```javascript
const { AuthCombinations } = require('../../../runtime-auth/security');
const chefSecurity = require('../../common/security');
const P = require('../../../forms/common/constants').Permissions;

routes.get('/:formId/schema', 
  chefSecurity.inline({
    allowedAuth: AuthCombinations.API_ONLY,
    requiredPermissions: [P.FORM_READ]
  }),
  controller.readFormSchema
);
```

The policy object accepts:
- `allowedAuth` - Array of auth types or use `AuthCombinations.*`
- `requiredPermissions` - Array of permission strings (e.g., `[P.FORM_READ]`)
- `resourceSpec` - Explicit resource definition (optional, auto-inferred if missing)
- `classification` - Explicit classification (optional, auto-inferred if missing)
- `pattern` - Explicit route pattern for logging (optional)

You can also pass a function that receives the request:

```javascript
routes.post('/:formId/submit',
  chefSecurity.inline((req) => ({
    allowedAuth: req.query.draft ? AuthCombinations.ANY : AuthCombinations.API_ONLY,
    requiredPermissions: req.query.draft ? [] : [P.SUBMISSION_CREATE]
  })),
  controller.createSubmission
);
```

### Centralized Policies

Centralized policies match routes by HTTP method and URL pattern. Useful when you want to define all your policies in one place:

```javascript
const policies = [
  {
    method: 'GET',
    pattern: '/forms/:formId',
    allowedAuth: AuthCombinations.API_OR_USER,
    requiredPermissions: [P.FORM_READ],
    classification: 'restricted'
  },
  {
    method: 'DELETE',
    pattern: '/forms/:formId/submissions/:submissionId',
    allowedAuth: AuthCombinations.AUTHENTICATED,
    requiredPermissions: [P.SUBMISSION_DELETE],
    resource: (req, params) => ({ 
      kind: 'submissionFromForm', 
      params 
    })
  },
  {
    method: 'GET',
    pattern: '/health/public',
    allowedAuth: ['public'],
    classification: 'public',
    resource: () => ({ kind: 'none' }),
    requiredPermissions: []
  }
];

routes.use(chefSecurity.withPolicies(policies));
```

The `pattern` uses Express-style route params (`:formId`, `:submissionId`). The `resource` function receives the request and extracted params, and should return a resource spec object.

If a request doesn't match any policy, you'll get a 404.

## Authentication Types

Use `AuthTypes` for individual auth types or `AuthCombinations` for common combinations:

```javascript
const { AuthTypes, AuthCombinations } = require('../../../runtime-auth/security');

// Individual types
allowedAuth: [AuthTypes.USER_OIDC]
allowedAuth: [AuthTypes.API_KEY_BASIC]
allowedAuth: [AuthTypes.GATEWAY_BEARER]
allowedAuth: [AuthTypes.PUBLIC]

// Common combinations
allowedAuth: AuthCombinations.AUTHENTICATED      // userOidc only
allowedAuth: AuthCombinations.API_ONLY          // apiKeyBasic + gatewayBearer
allowedAuth: AuthCombinations.API_OR_USER       // userOidc + apiKeyBasic
allowedAuth: AuthCombinations.PUBLIC_ONLY       // public only
allowedAuth: AuthCombinations.PUBLIC_OR_USER    // public + userOidc
allowedAuth: AuthCombinations.ANY               // all auth types
```

## Resource Specs

Resources tell the middleware what entity the request is operating on. The middleware uses this to fetch permissions from RBAC.

Most of the time you can let it auto-infer, but you can be explicit:

```javascript
// Auto-inferred (from :formId param)
chefSecurity.inline({
  requiredPermissions: [P.FORM_READ]
})

// Explicit form resource
chefSecurity.inline({
  resourceSpec: { kind: 'formOnly', params: { formId: 'abc123' } },
  requiredPermissions: [P.FORM_READ]
})

// Submission resource (needs formId + submissionId)
chefSecurity.inline({
  resourceSpec: { 
    kind: 'submissionFromForm', 
    params: { formId: 'abc123', submissionId: 'xyz789' } 
  },
  requiredPermissions: [P.SUBMISSION_READ]
})

// File resource
chefSecurity.inline({
  resourceSpec: { kind: 'file', params: { fileId: 'file123' } },
  requiredPermissions: [P.SUBMISSION_READ]
})

// No resource (public endpoint)
chefSecurity.inline({
  resourceSpec: { kind: 'none' },
  allowedAuth: ['public'],
  requiredPermissions: []
})
```

The `params` are usually extracted from `req.params`, but you can override them if needed.

## Overriding Dependencies

Sometimes you need to swap out services or change defaults. The `custom` method lets you override specific dependencies:

```javascript
const mockFormService = {
  readForm: jest.fn()
};

const middleware = chefSecurity.custom({
  services: {
    formService: mockFormService
  }
}, []);

routes.use(middleware);
```

You can also get the dependencies object to pass to other helpers:

```javascript
const deps = chefSecurity.getDeps();
const customHelper = require('./someHelper').makeHelper(deps);
```

If you're starting from scratch (not using `chefSecurity`), you can use the lower-level `buildSecurity`:

```javascript
const { buildSecurity } = require('../../../runtime-auth/security');

const middleware = buildSecurity({
  baseUrl: '/app',
  services: {
    authService: myAuthService,
    formService: myFormService,
    // ... etc
  },
  constants: myConstants
}, policies);
```

## Request Context

After the middleware runs, `req.securityContext` contains everything about the request. The structure varies slightly based on actor type.

### Authenticated User (OIDC)

```javascript
{
  correlationId: 'req-123',
  startedAt: '2024-01-01T00:00:00.000Z',
  finishedAt: '2024-01-01T00:00:01.000Z',
  route: {
    method: 'GET',
    pattern: '/:formId',
    path: '/api/v1/forms/abc123',
    query: {},
    classification: 'api'  // Inferred from URL path
  },
  who: {
    authType: 'user',           // Authentication method used
    strategyName: 'userOidc',   // Strategy that handled auth
    actor: {
      type: 'user',             // Actor type
      subtype: 'idir',          // IDP code (idir, bceid, etc.)
      id: 'user-123',           // User ID from database
      username: 'john.doe',     // Username
      email: 'john.doe@example.com',
      fullName: 'John Doe',
      firstName: 'John',
      lastName: 'Doe',
      isAdmin: false,           // From JWT client_roles
      metadata: {
        // Full user object from database
        clientRoles: ['form_designer'],
        // ... other user fields
      }
    },
    claims: { /* JWT payload */ }
  },
  resource: {
    form: { /* form object from database */ },
    submission: null,
    file: null,
    publicForm: false,          // Whether form allows public access
    activeForm: true            // Whether form is active
  },
  rbac: {
    actorId: 'user-123',        // Same as who.actor.id
    roles: ['form_designer'],   // Roles granted from database
    permissions: ['form_read', 'form_update'],  // Permissions granted
    decisions: [                // RBAC decision trace
      { predicate: 'isOwner', result: true },
      { predicate: 'hasRole', result: true, role: 'form_designer' }
    ],
    required: ['form_read']     // Permissions required by policy
  },
  timings: {
    t_auth: 45,                 // Time spent authenticating (ms)
    t_res: 12,                  // Time spent resolving resource (ms)
    t_rbac: 8,                  // Time spent enriching RBAC permissions (ms)
    total: 65                   // Total middleware execution time (ms)
  }
}
```

### API Key User

```javascript
{
  // ... same structure as above ...
  who: {
    authType: 'apiKey',
    strategyName: 'apiKeyBasic',
    actor: {
      type: 'apiKey',           // Different actor type
      id: 'user-api-key-id',    // Special API user ID from database
      username: 'runtime-auth-api-user',
      email: 'api@example.com',
      formId: 'abc123',         // Form ID from Basic auth
      metadata: {
        filesApiAccess: true,   // API key metadata
        apiKeyMetadata: { filesApiAccess: true }
        // ... user fields
      }
    },
    claims: { formId: 'abc123' }
  },
  // ... resource and rbac structure same as user ...
}
```

### Gateway Bearer Token User

```javascript
{
  // ... same structure ...
  who: {
    authType: 'gateway',
    strategyName: 'gatewayBearer',
    actor: {
      type: 'gateway',          // Different actor type
      id: 'user-gateway-id',    // Special gateway user ID from database
      formId: 'abc123',         // Form ID from gateway token
      metadata: {
        filesApiAccess: false,
        // ... user fields
      }
    },
    claims: { formId: 'abc123', apiKey: '...' }
  },
  // ... resource and rbac structure same as user ...
}
```

### Public User

```javascript
{
  // ... same structure ...
  who: {
    authType: 'public',
    strategyName: 'public',
    actor: {
      type: 'public',           // Public actor type
      id: 'user-public-id',     // Special public user ID from database
      username: 'runtime-auth-public-user',
      metadata: { /* user fields */ }
    },
    claims: { public: true }
  },
  resource: {
    form: { /* form object */ },
    publicForm: true,           // Form must be public for this to work
    // ...
  },
  rbac: {
    permissions: ['submission_create'],  // Limited public permissions
    decisions: [
      { predicate: 'isPublicForm', result: true }
    ],
    // ...
  },
  // ...
}
```

The middleware also sets `req.currentUser` and `req.apiUser` for backward compatibility with existing code. For API users (`apiKey` or `gateway` types), `req.apiUser` will be `true`.

## Error Handling

The middleware throws `api-problem` Problem instances:
- `404` - No matching policy found
- `401` - Authentication failed
- `404` - Resource not found
- `403` - Missing required permissions

These bubble up through Express's error handling, so make sure you have an error handler middleware registered.

## Examples from the Codebase

Here's how it's actually used in the webcomponents routes:

```javascript
// File routes - explicit resource type
routes.get('/:fileId',
  chefSecurity.inline({
    allowedAuth: AuthCombinations.API_ONLY,
    requiredPermissions: [P.SUBMISSION_READ],
    resourceSpec: { kind: 'file' }  // Auto-infers fileId from params
  }),
  originAccess,
  hasFilePermissions([P.SUBMISSION_READ]),
  controller.read
);

// Form schema - auto-inferred resource
routes.get('/:formId/schema',
  chefSecurity.inline({
    allowedAuth: AuthCombinations.API_ONLY,
    requiredPermissions: [P.FORM_READ]
    // resourceSpec auto-inferred as formOnly from :formId
  }),
  originAccess,
  controller.readFormSchema
);

// Submission with multiple permissions
routes.get('/:formId/submission/:formSubmissionId',
  chefSecurity.inline({
    allowedAuth: AuthCombinations.API_ONLY,
    requiredPermissions: [P.FORM_READ, P.SUBMISSION_READ]
    // resourceSpec auto-inferred as submissionFromForm
  }),
  originAccess,
  controller.readSubmission
);
```

## Testing

When testing routes that use this middleware, you'll need to mock the services. The test files in `app/tests/unit/runtime-auth/security/` show examples of how to structure mocks for the various strategies and services.

Key things to mock:
- `services.authService` - For user/auth lookups
- `services.formService` - For form lookups
- `services.rbacService` - For permission checks
- `services.jwtService` - For token validation
- `deps.oidc` - OIDC configuration if using `userOidc`

The middleware is designed to be testable—all dependencies are injected, so you can swap in test doubles easily.

