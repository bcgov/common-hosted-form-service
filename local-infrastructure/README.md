# Local Infrastructure for Formio Enterprise

The following will guide you through standing up a keycloak realm (with users) for local development/testing purposes.

## Environment variables

You will need a set of environment variables [.env](.env) which will be consumed by the [docker-compose.yaml](docker-compose.yaml) file. An example environment variable file can be found at [.env.example](.env.example). Refer to the docker-compose file for variables that will be used.

You can create your own .env file and pass in as the --env-file parameter, or set environment variables in your shell/terminal.

```sh
docker-compose --env-file=<your env file> <commands>
```

### Prerequisites

You have docker installed, and able to run docker-compose.
You have a mongodb installation on your physical machine. This docker compose does not create a mongodb server container for you.

**IMPORTANT**: If you are on Windows, you _MUST_ either use CMD or Powershell to execute these commands. Mingw64 based environments will not work correctly even with winpty.

#### Stand up services

This will stand up a formio and keycloak container in daemon mode.

```sh
docker-compose up -d
```

#### Add users to keycloak

You must wait for the keycloak service to be up and running. Once the keycloak service is running, we can just execute our create users script in the running container.

```sh
docker-compose exec keycloak bash /tmp/keycloak-local-user.sh
```

If you attempt to add users multiple times, expect to see error messages. No harm will be done.

#### Using default.env

Formio available at: <http://host.docker.internal:3000>, connect with `admin@example.com`/`p@ssw0rd!`
Keycloak available at: <http://host.docker.internal:28080>, log in with `admin`/`admin`

Users available in all form clients under "comfort" are:

- csst_role_1/password123 : Form Administrator
- csst_role_2/password123 : Form Editor
- csst_role_3/password123 : Form Reviewer
- csst_role_4/password123 : Form Viewer
- csst_role_5/password123 : Request Access

### Stop the services

You can stop the services (and preserve their current state) with stop. This will allow you to bring them back up with data.

```sh
docker-compose stop formio keycloak
```

### Remove the services

Data in the services (the user data in keycloak) is not persisted on down. You will need to run database migrations and add users to keycloak each time you bring the services back up after a down command.

```sh
docker-compose down
```

## Keycloak Authentication Setup

The following will outline the general process to set up Keycloak OAuth flow for Formio Enterprise.

### Client Setup

You will need to create a Keycloak Client using the OpenID Connect client protocol and have it set to public access type. Ensure that Standard Flow is enabled, and fill in the Root URL, Valid Redirect URIs, Admin URL and Web Origins fields based on where you are hosting the application. Note down the Client ID and the realm's well-known openid configuration as you will need it later.

### Formio Portal Base Setup

Once you have a Keycloak client set up, you will need to configure Formio Enterprise to leverage Resource Authentication. While there is Remote Authentication available, we found this to not be too helpful when attempting to manage Teams within Formio.

These instructions assume you are using the Formio web interface that is provided. For more specifics, you can visit the [Formio OAuth documentation](https://help.form.io/integrations/oauth/).

#### Settings

Navigate to the Portal Base project, and then go to the Settings tab (bottom left of the sidebar). Then select the Authentication button, and then OAuth. As we are leveraging OIDC, select the OpenID tab. Here, you will want to use the well-known openid configuration to fill in these fields:

| Field | Value |
| --- | --- |
| Authorize URI | well-known authorization_endpoint |
| Token URI | well-known token_endpoint |
| Client ID | Your Client ID |
| Client Secret | Put in "something" - your client is public and doesn't need a secret |
| Authorization Method | Body |
| User Info (claims) URI | well-known userinfo_endpoint |

Leave the Scope field blank, and ensure that under the Roles section, there is one entry whre Claim is empty, Value is empty, and Role is set to "Authenticated".

#### Login Form

Once the Portal Base project has the OAuth settings configured, you will need to manually create OAuth buttons in the Login form as mentioned in the [docs](https://help.form.io/integrations/oauth/#add-oauth-button-to-form).

In the Portal Base project, select the Forms tab, and then edit the "User Login Form". Drag and drop in a new button under the existing Log In button. Set the Label to "IDIR Login", change Action to OAuth, and set OAuth Provider to OpenID. For optional aesthetics, we suggest setting the button theme to something other than Primary, and enabling the Block Button option. Then save the form.

Once the button is set up, you need to set up an action for that button. Visit the actions tab, and then add a new "OAuth (Premium)" action. For Action Settings, set OAuth Provider to "OpenID", Action to "Login Existing Resource", Resource to "User", and Sign-in with OAuth Button to "IDIR Login". Then save this action.

At this stage, you should be able to create a new incognito window, and attempt to login to Formio through IDIR/Keycloak. Upon completion, you should expect to see an error along the lines of "OpenID account has not yet been linked". The next section will resolve this as you need to register your existence with Formio first.

#### Register Form

In the Portal Base project, select the Forms tab, and then edit the "User Registration Form". Drag and drop in a new button under the existing Log In button. Set the Label to "IDIR Register", change Action to OAuth, and set OAuth Provider to OpenID. For optional aesthetics, we suggest setting the button theme to something other than Primary, and enabling the Block Button option.

Once the button is set up, you need to set up an action for that button. Visit the actions tab, and then add a new "OAuth (Premium)" action. For Action Settings, set OAuth Provider to "OpenID", Action to "Register New Resource", Resource to "User", Role to "Authenticated" and Sign-in with OAuth Button to "IDIR Register".

The Field Mappings section maps JWT values provided by Keycloak into formio. You will want to set the following map claims and then save the action.

| Claim | Field |
| --- | --- |
| name | Name |
| preferred_username | Username |
| email | Email |

At this stage, you should be able to create a new incognito window, and attempt to register to Formio through IDIR/Keycloak. Upon completion, you should now be logged in. You can double check if things are mapping correctly by viewing your personal profile in the top right.

##### Disable Direct Formio Registration

If you want to prevent people from creating new accounts directly in Formio and only want users to enter through your OAuth provider, you will want to edit the "User Registration Form" again. For each of the four text fields, enable Hidden, Hide Label and Disabled. You may need to back-fill the Label field as it isn't populated by default. For the original Register button, enable the Hidden and Disabled flags and save. Then save the form. If done correctly, you should now only see the IDIR Register button in the Sign Up Now section.
