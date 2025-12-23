/**
 * FIFA TICKET SELECTOR - Content Script
 * Automatically selects configured matches on the FIFA ticket lottery page
 */

// ========== CONFIGURATION - EDIT YOUR MATCHES HERE ==========
const MATCH_CONFIG = [
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
];

const ACTION_DELAY = 2000; // Delay between actions in ms (increased for slow loading)
// ========== END CONFIGURATION ==========

(function() {
  'use strict';

  function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Find all match containers on the page
  function getAllMatchContainers() {
    // Look for containers with stx-expandable-tariffs or similar classes
    const containers = document.querySelectorAll('[id*="stx-expandable-tariffs-container"], [class*="tariffs-container"]');
    if (containers.length > 0) {
      return Array.from(containers);
    }

    // Fallback: find by looking for Match X text
    const allDivs = document.querySelectorAll('div');
    const matchContainers = [];

    for (const div of allDivs) {
      if (div.textContent.includes('Match ') && div.textContent.includes('Show more')) {
        // Check if we already have a parent of this
        let dominated = false;
        for (const existing of matchContainers) {
          if (existing.contains(div)) {
            dominated = true;
            break;
          }
        }
        if (!dominated) {
          matchContainers.push(div);
        }
      }
    }

    return matchContainers;
  }

  // Find match container by match number
  function findMatchContainer(matchNumber) {
    console.log(`[FIFA Selector] Looking for Match ${matchNumber} container...`);

    // Strategy 1: Find elements that contain EXACTLY "Match X" as their text
    // Look for heading-like elements that show match titles
    const matchTitleSelectors = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'span', 'div', 'p'];

    for (const selector of matchTitleSelectors) {
      const elements = document.querySelectorAll(selector);
      for (const el of elements) {
        // Get DIRECT text content only (not from children)
        const directText = Array.from(el.childNodes)
          .filter(n => n.nodeType === Node.TEXT_NODE)
          .map(n => n.textContent.trim())
          .join('');

        // Also check full text for exact match
        const fullText = el.textContent?.trim();

        // Match exactly "Match X" (not "Match 17" when looking for "Match 1")
        const exactMatch = `Match ${matchNumber}`;

        if (directText === exactMatch || fullText === exactMatch) {
          console.log(`[FIFA Selector] Found exact match title: "${fullText}"`);

          // Found match title, now find the container that has the Show more button
          let container = el;
          for (let i = 0; i < 20; i++) {
            if (container.parentElement) {
              container = container.parentElement;
              // Check if this container has "Show more" or categories
              const hasShowMore = container.textContent?.includes('Show more') || container.textContent?.includes('Show less');
              const hasCategories = container.querySelector('[class*="seatCategory"]') ||
                                   container.querySelector('[id*="seatCategory"]') ||
                                   container.textContent?.includes('Category 1');

              if (hasShowMore || hasCategories) {
                console.log(`[FIFA Selector] Found container for Match ${matchNumber}`);
                return container;
              }
            }
          }
          // Return what we found
          return el.parentElement?.parentElement?.parentElement || el;
        }
      }
    }

    // Strategy 2: Look for # M{number} pattern (like "# M3", "# M17")
    const allElements = document.querySelectorAll('*');
    for (const el of allElements) {
      const text = el.textContent?.trim();
      if (text === `# M${matchNumber}` || text === `#M${matchNumber}` || text === `M${matchNumber}`) {
        console.log(`[FIFA Selector] Found match via # M pattern: "${text}"`);
        let container = el;
        for (let i = 0; i < 20; i++) {
          if (container.parentElement) {
            container = container.parentElement;
            if (container.textContent?.includes('Show more') || container.textContent?.includes('Category')) {
              return container;
            }
          }
        }
        return el.parentElement?.parentElement?.parentElement || el;
      }
    }

    console.warn(`[FIFA Selector] Could not find container for Match ${matchNumber}`);
    return null;
  }

  // Expand match to show categories
  async function expandMatch(container) {
    // Strategy 1: Find the "Show more" button by looking for span.p-button-label with "Show more" text
    const buttonLabels = container.querySelectorAll('span.p-button-label, span[class*="button-label"]');
    for (const label of buttonLabels) {
      if (label.textContent?.trim()?.toLowerCase() === 'show more') {
        // Click the parent button, not just the span
        const btn = label.closest('button') || label.parentElement;
        if (btn) {
          console.log('[FIFA Selector] Clicking Show more button (via p-button-label)');
          btn.click();
          await delay(ACTION_DELAY);
          return true;
        }
      }
    }

    // Strategy 2: Find button with aria-label containing "Show more"
    const showMoreButtons = container.querySelectorAll('button[aria-label*="Show"], button[aria-label*="show"]');
    for (const btn of showMoreButtons) {
      console.log('[FIFA Selector] Clicking Show more button (via aria-label)');
      btn.click();
      await delay(ACTION_DELAY);
      return true;
    }

    // Strategy 3: Look for "Show more" text in any element
    const allSpans = container.querySelectorAll('span, div, a, button');
    for (const el of allSpans) {
      const text = el.textContent?.trim()?.toLowerCase();
      if (text === 'show more') {
        // Try to find and click the button parent
        const btn = el.closest('button');
        if (btn) {
          console.log('[FIFA Selector] Clicking Show more button (found parent)');
          btn.click();
        } else {
          console.log('[FIFA Selector] Clicking Show more element directly');
          el.click();
        }
        await delay(ACTION_DELAY);
        return true;
      }
    }

    // Strategy 4: Try finding expandable elements with aria-expanded
    const expandables = container.querySelectorAll('[aria-expanded="false"]');
    for (const exp of expandables) {
      console.log('[FIFA Selector] Clicking aria-expanded element');
      exp.click();
      await delay(ACTION_DELAY / 2);
    }

    return false;
  }

  // Select category within the match container
  async function selectCategory(container, categoryNumber) {
    console.log(`[FIFA Selector] Looking for Category ${categoryNumber}...`);

    // BEST Strategy: Search the ENTIRE DOCUMENT for stx-lt-seatCategory-name, then find ones within/near our container
    // First try within container
    let categoryNameElements = container.querySelectorAll('[id*="stx-lt-seatCategory-name"]');
    console.log(`[FIFA Selector] Found ${categoryNameElements.length} stx-lt-seatCategory-name elements in container`);

    // If none found in container, search entire document and find elements that are visible/near the match
    if (categoryNameElements.length === 0) {
      console.log(`[FIFA Selector] Searching entire document for category elements...`);
      categoryNameElements = document.querySelectorAll('[id*="stx-lt-seatCategory-name"]');
      console.log(`[FIFA Selector] Found ${categoryNameElements.length} stx-lt-seatCategory-name elements in document`);
    }

    for (const el of categoryNameElements) {
      const text = el.textContent?.trim() || '';
      console.log(`[FIFA Selector] Checking element with text: "${text}"`);

      // Check if this is our category (exact match, exclude accessibility)
      if (text === `Category ${categoryNumber}`) {
        // Find the clickable parent with role="button" or aria-controls
        let clickable = el.closest('[role="button"]') ||
                        el.closest('[aria-controls]') ||
                        el.closest('[aria-expanded]');

        if (clickable) {
          console.log(`[FIFA Selector] Found Category ${categoryNumber} via stx-lt-seatCategory-name, clicking...`);
          clickable.click();
          await delay(ACTION_DELAY);
          return clickable;
        }
      }
    }

    // Strategy 1: Look for stx-class elements (FIFA's pattern from DevTools)
    const stxElements = container.querySelectorAll('[class*="stx-"], [class*="dialog"], [class*="tariff"]');
    console.log(`[FIFA Selector] Found ${stxElements.length} stx/dialog/tariff elements`);

    // Strategy 2: Find all expandable tariff sections
    const tariffSections = container.querySelectorAll('[class*="expandable-tariff"], [id*="expandable-tariff"], [aria-controls*="tariff"]');
    console.log(`[FIFA Selector] Found ${tariffSections.length} tariff sections`);

    // Strategy 3: Look for the category row/accordion
    const allClickables = container.querySelectorAll('[role="button"], [aria-expanded], button, [class*="accordion"], [class*="expandable"], [class*="stx-expandable"]');

    for (const clickable of allClickables) {
      const text = clickable.textContent || '';
      // Check if this is our category (exclude accessibility categories)
      if (text.includes(`Category ${categoryNumber}`) &&
          !text.includes('Wheelchair') &&
          !text.includes('Easy Access') &&
          !text.includes('Companion') &&
          !text.includes('Accessibility')) {
        // Make sure it's the main category with a price
        if (text.includes('USD') || text.includes('$')) {
          console.log(`[FIFA Selector] Found Category ${categoryNumber}, clicking...`);
          clickable.click();
          await delay(ACTION_DELAY);
          return clickable;
        }
      }
    }

    // Strategy 4: Look for colored squares (category indicators) with data attributes
    const categoryIndicators = container.querySelectorAll('[class*="category"], [data-category], [class*="seat"]');
    for (const indicator of categoryIndicators) {
      const parent = indicator.closest('[aria-expanded]') || indicator.parentElement?.closest('[aria-expanded]');
      if (parent) {
        const text = parent.textContent || '';
        if (text.includes(`Category ${categoryNumber}`) && !text.includes('Wheelchair') && !text.includes('Easy Access')) {
          console.log(`[FIFA Selector] Found via indicator, clicking...`);
          parent.click();
          await delay(ACTION_DELAY);
          return parent;
        }
      }
    }

    // Strategy 5: Look for elements with seatCategory in class/id
    const categoryElements = container.querySelectorAll('[class*="seatCategory"], [id*="seatCategory"]');
    for (const el of categoryElements) {
      const text = el.textContent || '';
      if (text.trim().startsWith(`Category ${categoryNumber}`) || text.includes(`Category ${categoryNumber}`)) {
        // Find the clickable parent
        let target = el;
        let parent = el.parentElement;
        for (let i = 0; i < 8 && parent; i++) {
          if (parent.getAttribute('aria-expanded') !== null ||
              parent.getAttribute('role') === 'button' ||
              parent.classList.contains('expandable') ||
              parent.onclick) {
            target = parent;
            break;
          }
          parent = parent.parentElement;
        }
        console.log(`[FIFA Selector] Clicking category element`);
        target.click();
        await delay(ACTION_DELAY);
        return target;
      }
    }

    // Strategy 6: Find by text content directly
    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null, false);
    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (node.textContent.trim() === `Category ${categoryNumber}`) {
        let clickTarget = node.parentElement;
        // Go up to find clickable
        for (let i = 0; i < 5 && clickTarget; i++) {
          if (clickTarget.getAttribute('aria-expanded') !== null) {
            console.log(`[FIFA Selector] Found via text walker, clicking...`);
            clickTarget.click();
            await delay(ACTION_DELAY);
            return clickTarget;
          }
          clickTarget = clickTarget.parentElement;
        }
        // Just click the parent
        if (node.parentElement) {
          node.parentElement.click();
          await delay(ACTION_DELAY);
          return node.parentElement;
        }
      }
    }

    // Strategy 7: Click any element that contains exactly "Category X" text
    const allDivs = container.querySelectorAll('div, span, li, a');
    for (const div of allDivs) {
      // Check direct text content (not including children)
      const directText = Array.from(div.childNodes)
        .filter(n => n.nodeType === Node.TEXT_NODE)
        .map(n => n.textContent.trim())
        .join('');

      if (directText === `Category ${categoryNumber}`) {
        // Find closest clickable ancestor
        let clickable = div.closest('[aria-expanded]') ||
                        div.closest('[role="button"]') ||
                        div.closest('button') ||
                        div.parentElement;
        if (clickable) {
          console.log(`[FIFA Selector] Found via direct text match, clicking...`);
          clickable.click();
          await delay(ACTION_DELAY);
          return clickable;
        }
      }
    }

    return null;
  }

  // Set quantity using + button
  async function setQuantity(container, categoryElement, quantity) {
    // Find + button near the category
    let searchArea = categoryElement || container;

    // If category is expanded, look for + button in that section
    const plusButtons = searchArea.querySelectorAll('button');
    let plusBtn = null;
    let minusBtn = null;

    for (const btn of plusButtons) {
      const text = btn.textContent?.trim();
      if (text === '+') {
        plusBtn = btn;
      }
      if (text === '-' || text === '−') {
        minusBtn = btn;
      }
    }

    // If not found, search wider
    if (!plusBtn) {
      const allButtons = container.querySelectorAll('button');
      for (const btn of allButtons) {
        const text = btn.textContent?.trim();
        // Only get buttons that are visible
        if (text === '+' && btn.offsetParent !== null) {
          plusBtn = btn;
        }
        if ((text === '-' || text === '−') && btn.offsetParent !== null) {
          minusBtn = btn;
        }
      }
    }

    if (plusBtn) {
      console.log(`[FIFA Selector] Found +/- buttons, setting quantity to ${quantity}`);

      // Click plus button the required times
      for (let i = 0; i < quantity; i++) {
        plusBtn.click();
        await delay(300);
      }
      return true;
    }

    console.log('[FIFA Selector] Plus button not found');
    return false;
  }

  // Main function
  async function selectAllMatches() {
    console.log('[FIFA Selector] Starting auto-selection...');
    console.log('[FIFA Selector] Config:', MATCH_CONFIG);

    let successCount = 0;
    let failCount = 0;

    for (const config of MATCH_CONFIG) {
      const { matchNumber, category, quantity } = config;
      console.log(`[FIFA Selector] Processing Match ${matchNumber}, Category ${category}, Qty ${quantity}`);

      try {
        // Find match container
        const container = findMatchContainer(matchNumber);
        if (!container) {
          console.warn(`[FIFA Selector] Match ${matchNumber} not found`);
          failCount++;
          continue;
        }

        console.log(`[FIFA Selector] Found Match ${matchNumber}`);

        // Expand match (click "Show more")
        await expandMatch(container);
        await delay(ACTION_DELAY);

        // Wait for categories to load - poll until we find them or timeout
        console.log(`[FIFA Selector] Waiting for categories to load...`);
        let categoryFound = false;
        let categoryEl = null;

        // Re-find the container after expansion (DOM may have changed)
        const expandedContainer = findMatchContainer(matchNumber) || container;

        for (let attempt = 0; attempt < 5; attempt++) {
          // IMPORTANT: First search WITHIN the match container only
          let categoryElements = expandedContainer.querySelectorAll('[id*="stx-lt-seatCategory-name"]');
          console.log(`[FIFA Selector] Attempt ${attempt + 1}: Found ${categoryElements.length} category elements in match container`);

          // If none in container, search document but verify it's near our match
          if (categoryElements.length === 0) {
            categoryElements = document.querySelectorAll('[id*="stx-lt-seatCategory-name"]');
            console.log(`[FIFA Selector] Searching document: Found ${categoryElements.length} total category elements`);
          }

          for (const el of categoryElements) {
            const text = el.textContent?.trim() || '';
            if (text === `Category ${category}`) {
              // CRITICAL: Verify this category belongs to our match by checking if it's inside our container
              // or by checking if it's near our match number in the DOM
              const isInContainer = expandedContainer.contains(el);

              // Also check by looking for Match X text nearby
              let parentCheck = el.parentElement;
              let matchTextNearby = false;
              for (let i = 0; i < 20 && parentCheck; i++) {
                if (parentCheck.textContent?.includes(`Match ${matchNumber}`)) {
                  matchTextNearby = true;
                  break;
                }
                parentCheck = parentCheck.parentElement;
              }

              console.log(`[FIFA Selector] Category ${category} - inContainer: ${isInContainer}, matchTextNearby: ${matchTextNearby}`);

              if (isInContainer || matchTextNearby) {
                // Find the clickable parent
                let clickable = el.closest('[role="button"]') ||
                                el.closest('[aria-controls]') ||
                                el.closest('[aria-expanded]');

                if (clickable) {
                  console.log(`[FIFA Selector] Found Category ${category} for Match ${matchNumber}, clicking to expand...`);
                  clickable.click();
                  await delay(ACTION_DELAY);
                  categoryEl = clickable;
                  categoryFound = true;
                  break;
                }
              }
            }
          }

          if (categoryFound) break;
          await delay(1000); // Wait 1 second before next attempt
        }

        if (!categoryFound) {
          console.warn(`[FIFA Selector] Could not find Category ${category} for Match ${matchNumber}`);
          failCount++;
          continue;
        }

        await delay(ACTION_DELAY);

        // Now find and click the + button (it should be visible after clicking the category)
        // The + button has aria-label="Increase quantity..." or class containing "increase"
        let qtyOk = false;

        // Strategy 1: Find by aria-label containing "Increase quantity" - prefer buttons inside our container
        const increaseButtonsInContainer = expandedContainer.querySelectorAll('button[aria-label*="Increase quantity"]');
        const increaseButtonsAll = document.querySelectorAll('button[aria-label*="Increase quantity"]');

        // Try container first, then all
        const increaseButtons = increaseButtonsInContainer.length > 0 ? increaseButtonsInContainer : increaseButtonsAll;
        console.log(`[FIFA Selector] Found ${increaseButtons.length} increase buttons by aria-label (${increaseButtonsInContainer.length} in container)`);

        for (const btn of increaseButtons) {
          const rect = btn.getBoundingClientRect();
          // Only consider visible buttons that are in viewport
          if (rect.width > 0 && rect.height > 0 && rect.top > 0 && rect.top < window.innerHeight) {
            // Verify this button is for our category by checking aria-label contains "Category X"
            const ariaLabel = btn.getAttribute('aria-label') || '';
            if (ariaLabel.includes(`Category ${category}`)) {
              console.log(`[FIFA Selector] Found + button via aria-label for Category ${category}, clicking ${quantity} times...`);
              for (let i = 0; i < quantity; i++) {
                btn.click();
                await delay(500);
              }
              qtyOk = true;
              break;
            }
          }
        }

        // Fallback: click any visible + button if we didn't find category-specific one
        if (!qtyOk) {
          for (const btn of increaseButtons) {
            const rect = btn.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0 && rect.top > 0 && rect.top < window.innerHeight) {
              console.log(`[FIFA Selector] Found + button via aria-label (fallback), clicking ${quantity} times...`);
              for (let i = 0; i < quantity; i++) {
                btn.click();
                await delay(500);
              }
              qtyOk = true;
              break;
            }
          }
        }

        // Strategy 2: Find by class containing "increase"
        if (!qtyOk) {
          const increaseByClass = document.querySelectorAll('button[class*="increase"], button[class*="quantity-increase"]');
          console.log(`[FIFA Selector] Found ${increaseByClass.length} increase buttons by class`);

          for (const btn of increaseByClass) {
            const rect = btn.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
              console.log(`[FIFA Selector] Found + button via class, clicking ${quantity} times...`);
              for (let i = 0; i < quantity; i++) {
                btn.click();
                await delay(500);
              }
              qtyOk = true;
              break;
            }
          }
        }

        // Strategy 3: Find button with SVG remixicon (the + icon)
        if (!qtyOk) {
          const allButtons = document.querySelectorAll('button');
          for (const btn of allButtons) {
            const hasSvg = btn.querySelector('svg.remixicon, svg[class*="remix"]');
            const ariaLabel = btn.getAttribute('aria-label') || '';
            const rect = btn.getBoundingClientRect();

            if (hasSvg && ariaLabel.toLowerCase().includes('increase') && rect.width > 0 && rect.height > 0) {
              console.log(`[FIFA Selector] Found + button via SVG, clicking ${quantity} times...`);
              for (let i = 0; i < quantity; i++) {
                btn.click();
                await delay(500);
              }
              qtyOk = true;
              break;
            }
          }
        }

        // Old method as fallback (text-based)
        if (!qtyOk) {
          qtyOk = await setQuantity(container, categoryEl, quantity);
        }
        if (qtyOk) {
          successCount++;
          console.log(`[FIFA Selector] Match ${matchNumber} completed!`);
        } else {
          console.warn(`[FIFA Selector] Could not set quantity for Match ${matchNumber}`);
          failCount++;
        }

        // IMPORTANT: Collapse the category by clicking it again to avoid conflicts with next match
        if (categoryEl) {
          console.log(`[FIFA Selector] Collapsing category for Match ${matchNumber}...`);
          categoryEl.click();
          await delay(500);
        }

        // Also try to collapse by clicking "Show less" if it exists
        const showLessButtons = container.querySelectorAll('span.p-button-label, span[class*="button-label"]');
        for (const label of showLessButtons) {
          if (label.textContent?.trim()?.toLowerCase() === 'show less') {
            const btn = label.closest('button') || label.parentElement;
            if (btn) {
              console.log(`[FIFA Selector] Clicking Show less to collapse match`);
              btn.click();
              await delay(500);
            }
            break;
          }
        }

        await delay(ACTION_DELAY);

      } catch (error) {
        console.error(`[FIFA Selector] Error on Match ${matchNumber}:`, error);
        failCount++;
      }
    }

    console.log(`[FIFA Selector] Complete! Success: ${successCount}, Failed: ${failCount}`);
    showNotification(`Done! ${successCount} matches selected, ${failCount} failed.`);
  }

  function showNotification(message) {
    const existing = document.getElementById('fifa-selector-notification');
    if (existing) existing.remove();

    const notification = document.createElement('div');
    notification.id = 'fifa-selector-notification';
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
    `;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => notification.remove(), 5000);
  }

  // Keyboard shortcut
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 's') {
      e.preventDefault();
      selectAllMatches();
    }
  });

  // Listen for messages from background
  if (typeof chrome !== 'undefined' && chrome.runtime) {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.action === 'selectMatches') {
        selectAllMatches();
        sendResponse({ status: 'started' });
      }
      return true;
    });
  }

  console.log('[FIFA Selector] Extension loaded. Press Ctrl+Shift+S to select matches.');
  console.log('[FIFA Selector] Configured:', MATCH_CONFIG.length, 'matches');

})();
