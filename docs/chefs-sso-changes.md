# CHEFS Single Sign-On (Keycloak Standard Realm)

## History
Current state of OIDC sign in is using a custom Keycloak realm, managed by the CHEFs team. This realm uses Identity Providers for: IDIR, BCeID Basic and BCeID Business.

The custom Keycloak realm allows the CHEFs team complete control over the shape of tokens using Client Scopes and custom mappers.

Both the server/backend and the frontend have their own service clients: `chefs` and `chefs-frontend` respectively. User sign in through the UX/frontend using the `chefs-frontend` client. This client uses the a `chefs` scope to include security (roles) from the `chefs` client. Basically, the `chefs` client is responsible for security and the `chefs-frontend` allows getting a token through the browser.

The server based client (`chefs`) requires a `clientId` and `clientSecret` to connect and perform its security duties. Obviously a frontend client cannot be configured with a secret so that's where the two clients came in.


```
  "frontend": {
...
    "keycloak": {
      "clientId": "chefs-frontend",
      "realm": "chefs",
      "serverUrl": "https://dev.loginproxy.gov.bc.ca/auth"
    }
  },
  "server": {
...
    "keycloak": {
      "clientId": "chefs",
      "clientSecret": "...",
      "publicKey": "...",
      "realm": "chefs",
      "serverUrl": "https://dev.loginproxy.gov.bc.ca/auth"
    },
...
  },
```  

When a user would sign in, they would get a token like: 

```
{
  "exp": 1709164869,
  "iat": 1709164569,
  "auth_time": 1709164569,
  "jti": "4c2fbf8c-518c-484e-8b99-6fc36c9ba12f",
  "iss": "https://dev.loginproxy.gov.bc.ca/auth/realms/chefs",
  "aud": "chefs",
  "sub": "5c3e4a62-974b-4c81-ade5-3f2587d5363c",
  "typ": "Bearer",
  "azp": "chefs-frontend",
  "nonce": "ba7da2cb-fcdf-4146-88b3-cae8e775a891",
  "session_state": "6209cc93-9f99-466b-8d15-72f7f6bbc266",
  "resource_access": {
    "chefs": {
      "roles": [
        "user"
      ]
    }
  },
  "scope": "openid chefs",
  "sid": "6209cc93-9f99-466b-8d15-72f7f6bbc266",
  "identity_provider": "bceid-basic",
  "idp_username": "jason.sherman",
  "name": "Jason Sherman",
  "idp_userid": "22D34CC4510D4943A53362BDECD676C6",
  "preferred_username": "22d34cc4510d4943a53362bdecd676c6@bceidbasic",
  "given_name": "Jason Sherman",
  "email": "jason.sherman@gmail.com"
}
```

Note: the `aud`/`audience` is `chefs` even though the client is `chefs-frontend`. And that the `scope` includes `chefs` and also the `resource_access` is qualified by `chefs`.

The ability for CHEFs to manage our own Keycloak realm allows us to add the scope `chefs` to our `chefs-frontend` client and get data from the `chefs` client included in that token. This also allows the `chefs` client to verify and validate this token.

### User role

The user role is added to each user that signs in to the realm. No matter which Identity Provider is used, Keycloak will add a `chefs` user role to that user. This ends up in `resources_access:chefs:roles`.

## Standard realm limitations

Moving to the BC Government standard realm will allow CHEFs to use Single Sign-on but will take control over the shape of the token and they types of service clients we can create. This removes our ability to add custom token mappers for each Identity Provider, use custom scopes and removes auto-assignment of roles.


## Standard realm changes

Most significantly, we only use a single client: `chefs-frontend`. The type of client is changed to `Public` and is for browser logins only. This requires no client secret data to be stored or passed through to the frontend.

There is no need for a backend/server client, but we need to verify the token on each request. And this can be done by asking the OIDC server to verify using JSON Web Key Set (JWKS). So we need configuration to set up the verification. 

### SSO Integration Requests

To make requests, and to manage the clients: [Common Hosted Single Sign-On (CSS) Console](https://bcgov.github.io/sso-requests)


**Example SSO Integration Request**

```
Associated Team:
	Coco Team
Client Protocol:
	OpenID Connect
Client Type:
	Public
Usecase:
	Browser Login
Project Name:
	chefs-frontend
Primary End Users:
	People living in BC, People doing business/travel in BC, BC Gov Employees, Other: public - unauthenticated
Identity Providers Required:
	IDIR, Basic BCeID, Business BCeID
Dev Redirect URIs:
	https://chefs-dev.apps.silver.devops.gov.bc.ca/*
	https://chefs-fider.apps.silver.devops.gov.bc.ca/*
	https://dev.loginproxy.gov.bc.ca/*
Test Redirect URIs:
	https://chefs-fider.apps.silver.devops.gov.bc.ca/*
	https://chefs-test.apps.silver.devops.gov.bc.ca/*
	https://test.loginproxy.gov.bc.ca/*
Prod Redirect URIs:
	https://chefs-fider.apps.silver.devops.gov.bc.ca/*
	https://submit.digital.gov.bc.ca/app
```

** IMPORTANT** the client id will not be `chefs-frontend`, but will have some numerical suffix for each environment is deployed.  Ex. `chefs-frontend-5299` for development.

#### Admin role
This console will allow us to create `admin` role and then assign that role to users who have signed in using our client. Fairly similar process to what we have now (except we cannot assign by adding a user to a group).

### Identity Providers
Although we have the same identity providers: `IDIR`, `BCeID Basic` and `BCeID Business`, they are named differently. This means the values in tokens for `identity_provider` attribute and used as `idpHints` are different.

In our custom realm: `idir`, `bceid-basic` and `bceid-business`. 

In standard realm:   `idir`, `bceidbasic` and `bceidbusiness`.

We address this in our IdentityProvider table via `code` and `idp` where `idp` is the Keycloak Identity provider name.


### Token Changes

Since we lose the ability to add custom mappers and the tokens are different for each Identity Provider. 

For instance, in each IDP we would map an attribute (`idir_username`, `bceid_username`) that would end up in the token as `idp_username`. So the token would be consistent. So, in the frontend and token parsing is inconsistent as we lose our `idp_XXX` fields. We handle this in the server as we build our user objects by reading a configuration that maps token attributes to user attribues. 

**NOTE** maybe we should place similar logic in the frontend. We do have the IDP configuration cached so we can use that to write a parsing function.

Summary:
1. `identity_provider` attribute values have changed
2. `resource_access` no longer supplied, replace with a similar list of roles: `client_roles`
3. `idp_XXX` attributes no longer exist, each IDP has a unique set of attributes. There is overlap on some attributes.


### CHEFs Configuration

Configuration for the frontend does not change signifcantly (nor does the actual javascript/Vue code to interact with the library). We do need to add in a `logoutUrl`.

However the server configuration changes significantly; as does the code base.

**Example configuration**

```
    "frontend": {
...
      "oidc": {
        "clientId": "chefs-frontend-localhost-5300",
        "realm": "standard",
        "serverUrl": "https://dev.loginproxy.gov.bc.ca/auth",
        "logoutUrl": "https://logon7.gov.bc.ca/clp-cgi/logoff.cgi?retnow=1&returl=https%3A%2F%2Fdev.loginproxy.gov.bc.ca%2Fauth%2Frealms%2Fstandard%2Fprotocol%2Fopenid-connect%2Flogout"
      }
    },
    "server": {
...
      "oidc": {
        "realm": "standard",
        "serverUrl": "https://dev.loginproxy.gov.bc.ca/auth",
        "jwksUri": "https://dev.loginproxy.gov.bc.ca/auth/realms/standard/protocol/openid-connect/certs",
        "issuer": "https://dev.loginproxy.gov.bc.ca/auth/realms/standard",
        "audience": "chefs-frontend-localhost-5300",
        "maxTokenAge": "300"
      },
...
    },
```

Note that the configuration block key has changed from `keycloak` to `oidc`. This is mainly to allow two completely different CHEFs instances running side by side in our development namespace. As all instances share the same config maps/secrets, we need to deploy a new config map for this transition.

The server configuration now uses the frontend `clientId` as the `audience`. We expect the token to come from a particular issuer for a particular client. 

**IMPORTANT** unclear if verifying the `audience/clientId` will allow true single sign-on. Will have to consult with the SSO team and maybe loosen our verify call to only check token age and issuer.

#### Logout URL

The addition of the logout url is to support logging out from Siteminder and Keycloak. Note that the configuration contains only part of the complete logout url as we need to build the redirect url at runtime and add in a `client_id`.

See note [here](https://github.com/bcgov/keycloak-example-apps/blob/4fdf10494dea8b14d460c2d4a8648f0fdccb965c/examples/oidc/public/vue/src/services/keycloak.js#L36).


### OIDC Config Map
Add a new OIDC Config map (no differentition for frontend/server as it is the same client).

```sh
oc create -n $NAMESPACE configmap $APP_NAME-oidc-config \
  --from-literal=OIDC_REALM=standard \
  --from-literal=OIDC_SERVERURL=https://dev.loginproxy.gov.bc.ca/auth \
  --from-literal=OIDC_JWKSURI=https://dev.loginproxy.gov.bc.ca/auth/realms/standard/protocol/openid-connect/certs \
  --from-literal=OIDC_ISSUER=https://dev.loginproxy.gov.bc.ca/auth/realms/standard \
  --from-literal=OIDC_CLIENTID=chefs-frontend-5299 \
  --from-literal=OIDC_MAXTOKENAGE=300 \
  --from-literal=OIDC_LOGOUTURL='https://logon7.gov.bc.ca/clp-cgi/logoff.cgi?retnow=1&returl=https%3A%2F%2Fdev.loginproxy.gov.bc.ca%2Fauth%2Frealms%2Fstandard%2Fprotocol%2Fopenid-connect%2Flogout' 
```

### Backend code changes

Significant changes to server/backend code. Most notably we remove `keycloak-connect` library. Keycloak keeps threatening to deprecate this library, so good to get rid of it. However, it did provide a lot of useful middleware that we've had to replicate.

Most logic is found in `components/jwtService.js` including the `protect` middleware. Changes to the token and how we map to a user are found in `components/idpService.js`.


### Frontend code changes

Basically the frontend remains the same as we continue to use the same library: `keycloak-js`.

The `init` is slightly different as we move to a `public` client, we need to specify that we want to use `pkceMethod`:

```
    init: { pkceMethod: 'S256', checkLoginIframe: false, onLoad: 'check-sso' },
```

Changes to the token mean we change how we determine roles. We no longer qualify by resource (`chefs`). and we get the data from `client_roles`.

Since we added the `logoutUrl`, the logout method has changed too. `logoutUrl` is optional, which will make it easier for non-BC installations.  See the auth store (`store/auth.js`).


