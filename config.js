/**
 * FIFA TICKET SELECTOR - CONFIGURATION
 * =====================================
 * Edit this file to configure which matches and categories to auto-select.
 *
 * HOW TO USE:
 * 1. Set your desired matches in the MATCH_CONFIG array below
 * 2. Each match needs:
 *    - matchNumber: The match number (e.g., 1 for "Match 1", 2 for "Match 2")
 *    - category: Which category to select (1, 2, or 3)
 *    - quantity: How many tickets (1-4)
 * 3. Save this file
 * 4. Load/reload the extension in Chrome
 * 5. Go to the FIFA ticket page and press Ctrl+Shift+S (or Cmd+Shift+S on Mac)
 *
 * EXAMPLE CONFIG:
 * { matchNumber: 1, category: 2, quantity: 2 }  // Match 1, Category 2, 2 tickets
 * { matchNumber: 3, category: 1, quantity: 1 }  // Match 3, Category 1, 1 ticket
 */

const MATCH_CONFIG = [
  // ========== EDIT YOUR MATCHES BELOW ==========

  { matchNumber: 1, category: 2, quantity: 2 },
  { matchNumber: 2, category: 2, quantity: 2 },
  { matchNumber: 3, category: 2, quantity: 2 },
  { matchNumber: 4, category: 2, quantity: 2 },
  { matchNumber: 5, category: 2, quantity: 2 },
  // { matchNumber: 6, category: 2, quantity: 2 },
  // { matchNumber: 7, category: 2, quantity: 2 },
  // { matchNumber: 8, category: 2, quantity: 2 },
  // { matchNumber: 9, category: 2, quantity: 2 },
  // { matchNumber: 10, category: 2, quantity: 2 },

  // ========== END OF CONFIGURATION ==========
];

// Hotkey to trigger selection (for display purposes)
const HOTKEY = "Ctrl+Shift+S";

// Delay between actions (milliseconds) - increase if page is slow
const ACTION_DELAY = 500;
