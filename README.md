# Browser Utils

A project for learning/testing MV3 browser extension & javascript api stuff,
that's all

## Disclaimer

This extension is developed with the intension of using it only for educational
purpose.

## Main features

- YouTube
   - Disable watch history & view count tracking
   - Block most ads without getting detected
   - Remove share tracking id from share link
   - Jump ahead feature via [SponsorBlock API](https://sponsor.ajay.app/)
   - Mostly works feed filter (hide shorts/live/video)
   - Live DVR (enable seeking for livestream that doesn't have it enabled)
   - Low latency live (adjust playback rate to get lowest possible latency while keeping barely enough buffer to play)
   - Offline downloads export (custom bundle format/audio only/video only)
   - Offline downloads import (custom bundle format)
   - Force unlock offline downloads (experimental video downloader)
   - Unlock TVHTML5 client (put `/tv` after the domain)

Branch config at `<path-to-project-directory>/dist/extension/package/branch.json` for the features listed above
```json
{
  "selected": "main",
  "branches": [
    {
      "id": "main",
      "url": null,
      "scripts": [
        "common/preload",
        "custom/youtube"
      ],
      "encrypt": false,
      "enabled": true,
      "logging": false
    }
  ]
}
```

## Other features

NOTE: Features listed might not always work

- Download sites
  1. =========================
     - Auto download
     - Skip waiting
  2. =========================
     - Auto download
  3. =========================
     - Add artifact download button
- Video platforms
  1. =========================
     - Hide video ad (fake buffering)
  2. =========================
     - Hide most ads
     - P2P remote control/stream via web app
     - Unlock higher quality content
     - Unlock some content when logged out
     - Watch history via local storage

## Setup

First clone project then install required dependencies.

```bash
git clone https://github.com/NotArandomGUY/browser-utils.git
cd browser-utils
npm install
```

## Building

Build project and output to `dist` directory. (Need to rebuild after modifying
source code)

```bash
npm run build
```

## Installing

1. Go to the Extensions page by entering `chrome://extensions` in a new tab. (By
   design `chrome://` URLs are not linkable.)
   - Alternatively, click the Extensions menu puzzle button and select **Manage
     Extensions** at the bottom of the menu.
   - Or, click the Chrome menu, hover over **More Tools**, then select
     **Extensions**.
2. Enable Developer Mode by clicking the toggle switch next to **Developer
   mode**.
3. Click **Load unpacked** button and select the extension directory
   `<path-to-project-directory>/dist/extension`.
