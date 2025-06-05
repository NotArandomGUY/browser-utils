# Browser Utils
A project for learning/testing MV3 browser extension & javascript api stuff, that's all

## Disclaimer
This extension is developed with the intension of using it only for educational purpose.

## Setup
First clone project then install required dependencies.
```bash
git clone https://github.com/NotArandomGUY/browser-utils.git
cd browser-utils
npm install
```

## Building
Build project and output to `dist` directory. (Need to rebuild after modifying source code)
```bash
npm run build
```

## Installing
1. Go to the Extensions page by entering `chrome://extensions` in a new tab. (By design `chrome://` URLs are not linkable.)
    - Alternatively, click the Extensions menu puzzle button and select **Manage Extensions** at the bottom of the menu.
    - Or, click the Chrome menu, hover over **More Tools**, then select **Extensions**.
2. Enable Developer Mode by clicking the toggle switch next to **Developer mode**.
3. Click **Load unpacked** button and select the extension directory `<path-to-project-directory>/dist/extension`.