FIFA TICKET SELECTOR - Chrome Extension
=======================================

QUICK START
-----------
1. Edit config.js to set your matches (see CONFIGURATION below)
2. Load extension into Chrome (see INSTALLATION below)
3. Go to the FIFA ticket page
4. Press Ctrl+Shift+S (or Cmd+Shift+S on Mac)
5. Watch your matches get selected automatically!


INSTALLATION
------------
1. Open Chrome and go to: chrome://extensions/
2. Enable "Developer mode" (toggle in top-right corner)
3. Click "Load unpacked"
4. Select this folder (fifa-ticket-selector)
5. The extension is now active!


CONFIGURATION
-------------
Open config.js in any text editor (Notepad works fine).

Find the MATCH_CONFIG section and edit your matches:

  { matchNumber: 1, category: 2, quantity: 2 },
  { matchNumber: 3, category: 1, quantity: 1 },
  { matchNumber: 5, category: 2, quantity: 2 },

Each line is one match:
- matchNumber: Which match (1, 2, 3, etc.)
- category: Which ticket category (1, 2, or 3)
- quantity: How many tickets (1-4)

To disable a match, add // at the start:
  // { matchNumber: 6, category: 2, quantity: 2 },

Save the file after editing.


USING MULTIPLE CHROME PROFILES
------------------------------
1. Edit config.js with your desired settings
2. Copy the entire folder to a new location (optional)
3. Load the extension in each Chrome profile separately
4. Each profile will use the same config


HOTKEY
------
Default: Ctrl+Shift+S (Windows/Linux) or Cmd+Shift+S (Mac)

To change the hotkey:
1. Go to chrome://extensions/shortcuts
2. Find "FIFA Ticket Selector"
3. Click the pencil icon next to "Select all configured matches"
4. Press your new shortcut


TROUBLESHOOTING
---------------
Q: Nothing happens when I press the hotkey
A: Make sure you're on the FIFA tickets page (fifa-fwc26-us.tickets.fifa.com)
   Try reloading the page, then press the hotkey again.

Q: Some matches aren't being selected
A: The page structure may have changed. Increase ACTION_DELAY in config.js
   (try 1000 instead of 500 for slower connections).

Q: How do I see what's happening?
A: Open Developer Tools (F12), go to Console tab. The extension logs
   its progress there.


FILES
-----
manifest.json  - Extension configuration (don't edit)
config.js      - YOUR MATCH SETTINGS (edit this!)
content.js     - Selection logic (advanced users only)
background.js  - Hotkey handler (don't edit)
icon*.png      - Extension icons


SUPPORT
-------
Contact me on Freelancer if you have any issues!
