# KPal Client

<img src="./img/logo.png" alt="logo" width="200"/>

Electron desktop client for Krunker.IO

## Usage

This repository only contains the source code for KPal Client. In order to use it, you must build it from source.

### Building

Programs required:

- [NodeJS](https://nodejs.org/en)

1. [Download the source code ZIP](https://github.com/e9x/kpal_client/archive/refs/heads/master.zip)
2. Extract kpal_client-master to a folder
3. Open kpal_client-master in a terminal
4. Run the following commands:
   ```sh
   npm install
   npm run build
   npm run dist
   ```
5. Once the commands are finished executing, navigate to kpal_client-master/dist/
6. You should see the .exe installer for KPal Client.

## Keybinds

- <kbd>F3</kbd> Quick search using matchmaker
- <kbd>F4</kbd> Find a random new match
- <kbd>F5</kbd> Refresh the page
- <kbd>F11</kbd> Enter/exit fullscreen
- <kbd>ALT</kbd> + <kbd>F4</kbd> Close window

## Flags

### `--sandbox`

Starts the client on https://krunker.io/?sandbox.

### `--dev`

Disables update checks and opens the built-in developer tools. If developer tools aren't available, look into `--remote-debug`.

### `--remote-debug`

Runs the Chrome remote debugger on port 9229.

## License Disclaimer

This project is a fork of [KPal81's KPal Client](https://github.com/kpal81xd/krunker-kpal-client-RELEASE), which is licensed under the MIT License. The original project's license can be found in the file LICENSE-KPAL. All modifications and additions made to this fork are released under the GNU General Public License v3. The GPLv3 license file can be found in the LICENSE file in this repository.

Please note that by using or contributing to this fork, you are agreeing to comply with both the original MIT License and the GPLv3 License. It is the user's responsibility to ensure compliance with the licensing terms of both licenses while using, modifying, or distributing any part of this project.

For more information on the respective licenses, please refer to:

- MIT License: https://opensource.org/licenses/MIT
- GPLv3 License: https://www.gnu.org/licenses/gpl-3.0.en.html
