# VSCode Tools

This repo contains some tools to make VSCode development a little easier.

## Launcher

CHEFS can be start using the `Run and Debug` item in the Activity Bar. The `launcher.json` file defines the launchers:

- `CHEFS API`: start the CHEFS API in debug mode
- `CHEFS Frontend`: start the CHEFS Frontend in debug mode
- `CHEFS`: start both `CHEFS API` and `CHEFS Frontend`

## Tasks

Tasks can be run from the `Terminal` > `Run Task...` menu item. The `tasks.json` file defines the tasks:

- `All - Reinstall`: reinstall the packages for both the API and the Frontend
- `Unit Tests - API`: run the unit tests for the API
- `Unit Tests - Frontend`: run the unit tests for the Frontend
- `Components Build`: build the formio components
- `Components Deploy`: deploy the formio components. Build and deploy before serving the frontend will save lots of time.
- `chefs_local up`: when inside the devcontainer, will bring up postgresql and nats for local CHEFS deployment.
- `chefs_local down`: when inside the devcontainer, will tear down running postgresql and nats for local CHEFS deployment.

Tip: You can run the builtin `All Tests` task to run both of the unit tests at the same time. This is possible since they're both configured to be in the `test` group.

Tip: In `File` > `Preferences` > `Keyboard Shortcuts` the command `Tasks: Run Test Task` runs the `All Tests` task. In the Windows world it seems that `Ctrl` + `Alt` + `T` is unused as a keybinding and it makes an easy-to-remember shortcut.
