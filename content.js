/**
 * FIFA TICKET SELECTOR - Content Script
 * Automatically selects configured matches on the FIFA ticket lottery page
 */

(function() {
  'use strict';

  // Helper function to wait/delay
  function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Helper function to find match card by match number
  function findMatchCard(matchNumber) {
    // Look for match cards with "Match X" text
    const matchCards = document.querySelectorAll('[class*="match"], [class*="Match"], [data-match], article, section');

    for (const card of matchCards) {
      const text = card.textContent;
      // Match patterns like "Match 1", "Match 2", "#M1", "#M2", "# M1", etc.
      const patterns = [
        new RegExp(`Match\\s*${matchNumber}\\b`, 'i'),
        new RegExp(`#\\s*M${matchNumber}\\b`, 'i'),
        new RegExp(`M${matchNumber}\\b`)
      ];

      for (const pattern of patterns) {
        if (pattern.test(text)) {
          return card;
        }
      }
    }

    return null;
  }

  // Helper function to find and click "Show more" button within a match card
  async function expandMatch(matchCard) {
    const showMoreBtn = matchCard.querySelector('button, [role="button"], a, span');
    const buttons = matchCard.querySelectorAll('button, [role="button"], a, span, div[class*="click"], div[class*="expand"]');

    for (const btn of buttons) {
      const text = btn.textContent.toLowerCase().trim();
      if (text.includes('show more') || text.includes('expand') || text.includes('details')) {
        btn.click();
        await delay(ACTION_DELAY);
        return true;
      }
    }

    // Try clicking on the match card itself if it's expandable
    const clickableArea = matchCard.querySelector('[class*="header"], [class*="title"], [class*="clickable"]');
    if (clickableArea) {
      clickableArea.click();
      await delay(ACTION_DELAY);
      return true;
    }

    return false;
  }

  // Helper function to select a category within a match card
  async function selectCategory(matchCard, categoryNumber) {
    // Look for category options - they might be radio buttons, buttons, or clickable divs
    const categorySelectors = [
      `[data-category="${categoryNumber}"]`,
      `input[value="${categoryNumber}"]`,
      `input[value="category${categoryNumber}"]`,
      `[class*="category-${categoryNumber}"]`,
      `[class*="category${categoryNumber}"]`
    ];

    // First try direct selectors
    for (const selector of categorySelectors) {
      const element = matchCard.querySelector(selector);
      if (element) {
        element.click();
        await delay(ACTION_DELAY / 2);
        return true;
      }
    }

    // Look for category text and click its parent/container
    const allElements = matchCard.querySelectorAll('*');
    for (const el of allElements) {
      const text = el.textContent.trim();
      // Match "Category 1", "Category 2", "Category 3" exactly
      if (text === `Category ${categoryNumber}` || text === `Category${categoryNumber}`) {
        // Find the clickable parent (usually a div or label)
        let clickTarget = el;
        let parent = el.parentElement;

        // Look for a clickable parent container
        for (let i = 0; i < 5 && parent; i++) {
          if (parent.onclick || parent.getAttribute('role') === 'button' ||
              parent.tagName === 'LABEL' || parent.tagName === 'BUTTON' ||
              parent.classList.contains('clickable') ||
              parent.style.cursor === 'pointer') {
            clickTarget = parent;
            break;
          }
          // Check if parent has a radio/checkbox input
          const input = parent.querySelector('input[type="radio"], input[type="checkbox"]');
          if (input) {
            clickTarget = input;
            break;
          }
          parent = parent.parentElement;
        }

        clickTarget.click();
        await delay(ACTION_DELAY / 2);

        // Also try to expand category if there's a dropdown
        const expandBtn = clickTarget.closest('[class*="category"], [class*="accordion"]')?.querySelector('[class*="expand"], [class*="arrow"], [class*="chevron"]');
        if (expandBtn) {
          expandBtn.click();
          await delay(ACTION_DELAY / 2);
        }

        return true;
      }
    }

    // Fallback: look for any expandable/selectable rows with category in name
    const rows = matchCard.querySelectorAll('[class*="row"], [class*="option"], [class*="item"], tr, li');
    for (const row of rows) {
      if (row.textContent.includes(`Category ${categoryNumber}`)) {
        row.click();
        await delay(ACTION_DELAY / 2);
        return true;
      }
    }

    return false;
  }

  // Helper function to set quantity using +/- buttons
  async function setQuantity(matchCard, quantity) {
    // Find quantity controls within the category section
    const plusButtons = matchCard.querySelectorAll('button, [role="button"]');
    let plusBtn = null;
    let minusBtn = null;
    let quantityInput = null;

    for (const btn of plusButtons) {
      const text = btn.textContent.trim();
      const ariaLabel = (btn.getAttribute('aria-label') || '').toLowerCase();

      if (text === '+' || ariaLabel.includes('add') || ariaLabel.includes('increase') || ariaLabel.includes('plus')) {
        plusBtn = btn;
      }
      if (text === '-' || text === '−' || ariaLabel.includes('remove') || ariaLabel.includes('decrease') || ariaLabel.includes('minus')) {
        minusBtn = btn;
      }
    }

    // Also look for number input
    quantityInput = matchCard.querySelector('input[type="number"], input[class*="quantity"], input[class*="qty"]');

    if (quantityInput) {
      // Direct input if available
      quantityInput.value = quantity;
      quantityInput.dispatchEvent(new Event('input', { bubbles: true }));
      quantityInput.dispatchEvent(new Event('change', { bubbles: true }));
      await delay(ACTION_DELAY / 2);
      return true;
    }

    if (plusBtn) {
      // Click plus button the required number of times
      // First, reset to 0 by clicking minus until disabled or value is 0
      if (minusBtn) {
        for (let i = 0; i < 10; i++) {
          if (minusBtn.disabled) break;
          minusBtn.click();
          await delay(100);
        }
      }

      // Now click plus to reach desired quantity
      for (let i = 0; i < quantity; i++) {
        plusBtn.click();
        await delay(150);
      }
      return true;
    }

    return false;
  }

  // Main function to select all configured matches
  async function selectAllMatches() {
    console.log('[FIFA Selector] Starting auto-selection...');
    console.log('[FIFA Selector] Config:', MATCH_CONFIG);

    let successCount = 0;
    let failCount = 0;

    for (const config of MATCH_CONFIG) {
      const { matchNumber, category, quantity } = config;
      console.log(`[FIFA Selector] Processing Match ${matchNumber}, Category ${category}, Qty ${quantity}`);

      try {
        // Find the match card
        const matchCard = findMatchCard(matchNumber);
        if (!matchCard) {
          console.warn(`[FIFA Selector] Match ${matchNumber} not found on page`);
          failCount++;
          continue;
        }

        console.log(`[FIFA Selector] Found Match ${matchNumber}`);

        // Expand the match to show categories
        await expandMatch(matchCard);
        await delay(ACTION_DELAY);

        // Select the category
        const categorySelected = await selectCategory(matchCard, category);
        if (!categorySelected) {
          console.warn(`[FIFA Selector] Could not select Category ${category} for Match ${matchNumber}`);
        }

        // Set quantity
        const quantitySet = await setQuantity(matchCard, quantity);
        if (!quantitySet) {
          console.warn(`[FIFA Selector] Could not set quantity for Match ${matchNumber}`);
        }

        if (categorySelected || quantitySet) {
          successCount++;
        } else {
          failCount++;
        }

        // Wait before processing next match
        await delay(ACTION_DELAY);

      } catch (error) {
        console.error(`[FIFA Selector] Error processing Match ${matchNumber}:`, error);
        failCount++;
      }
    }

    console.log(`[FIFA Selector] Complete! Success: ${successCount}, Failed: ${failCount}`);

    // Show notification to user
    showNotification(`Selection complete! ${successCount} matches selected, ${failCount} failed.`);
  }

  // Show a notification on the page
  function showNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #1a472a;
      color: white;
      padding: 16px 24px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      z-index: 999999;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;

    // Add animation keyframes
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
    `;
    document.head.appendChild(style);
    document.body.appendChild(notification);

    // Remove after 4 seconds
    setTimeout(() => {
      notification.style.animation = 'slideIn 0.3s ease reverse';
      setTimeout(() => notification.remove(), 300);
    }, 4000);
  }

  // Listen for messages from background script (for hotkey)
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'selectMatches') {
      selectAllMatches();
      sendResponse({ status: 'started' });
    }
    return true;
  });

  // Also allow triggering via keyboard shortcut directly in page
  document.addEventListener('keydown', (e) => {
    // Ctrl+Shift+S or Cmd+Shift+S
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 's') {
      e.preventDefault();
      selectAllMatches();
    }
  });

  // Log that the extension is loaded
  console.log('[FIFA Selector] Extension loaded. Press Ctrl+Shift+S to select configured matches.');
  console.log('[FIFA Selector] Configured matches:', MATCH_CONFIG.length);

})();
