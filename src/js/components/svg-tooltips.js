/**
 * SVG Tooltips Component
 * Manages tooltip display for SVG map elements
 */

export default class SvgTooltips {
  constructor(config = {}) {
    this.tooltip = null;
    this.hideTimeout = null;
    this.tooltipData = {};
    this.isInitialized = false;
    this.eventListeners = [];

    // Configuration
    this.config = {
      tooltipSelector: '.tooltip', // Default value
      ...config, // Other settings must be passed when creating an instance
    };

    // Check if device is touch-enabled
    this.isTouchDevice =
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      window.matchMedia('(pointer: coarse)').matches;

    // Force touch device for testing (remove this in production)
    if (window.location.search.includes('force-touch=true')) {
      this.isTouchDevice = true;
    }

    // Initialize asynchronously
    this.initialize();
  }

  async initialize() {
    try {
      // Always load data first, then decide what to show
      await this.loadTooltipData();

      // Show/hide touch fallback based on device type
      this.handleTouchFallback();
    } catch (error) {
      console.error('Failed to initialize SvgTooltips:', error);
    }
  }

  async loadTooltipData() {
    // Check that file path is specified
    if (!this.config.dataFile) {
      console.error('dataFile is required in config');
      this.init();
      return;
    }

    // First try to load data from JSON file
    try {
      const response = await fetch(this.config.dataFile, {
        cache: 'no-cache',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const text = await response.text();

      // Check that response is actually JSON, not HTML
      if (
        text.trim().startsWith('<!doctype') ||
        text.trim().startsWith('<html')
      ) {
        throw new Error('Received HTML instead of JSON');
      }

      this.tooltipData = JSON.parse(text);

      // Always populate selection list with data
      this.populateSelectionList();

      // Apply status classes to SVG elements
      this.applyStatusClasses();

      // Initialize tooltips after data is loaded
      this.init();
    } catch (error) {
      console.error('Error loading tooltip data:', error);
    }
  }

  init() {
    this.createTooltip();
    this.bindEvents();
    this.bindWindowEvents();
    this.bindSelectionListTriggers();
    this.isInitialized = true;
  }

  createTooltip() {
    // Check if tooltip already exists
    const existingTooltip = document.querySelector(this.config.tooltipSelector);

    if (existingTooltip) {
      // If tooltip exists, remove it to avoid duplicates
      existingTooltip.remove();
    }

    // Create new tooltip
    this.tooltip = document.createElement('div');
    this.tooltip.className = 'tooltip';
    this.tooltip.style.display = 'none';

    this.tooltip.innerHTML = `
              <span class="tooltip_text element_name"></span>
              <div class="divider"></div>
              <div class="tooltip_info-list">
              <div class="tooltip_close status">
                  <span class="status-text"></span>
                  <span class="count-text"></span>
              </div>
              <div class="tooltip_close count">
                  <span class="status-text"></span>
                  <span class="count-text"></span>
              </div>
              <div class="tooltip_close area">
                  <span class="status-text"></span>
                  <span class="count-text"></span>
              </div>
              <div class="tooltip_close price">
                  <span class="status-text"></span>
                  <span class="count-text"></span>
              </div>
            </div>
          `;

    // Add tooltip to body for proper positioning
    document.body.appendChild(this.tooltip);
  }

  bindEvents() {
    // Check that SVG selector is specified
    if (!this.config.svgSelector) {
      console.error('svgSelector is required in config');
      return;
    }

    const svg = document.querySelector(this.config.svgSelector);
    if (!svg) {
      return;
    }

    // Find all interactive elements by matching classes present in tooltipData
    const allWithClass = svg.querySelectorAll('[class]');
    const elementPaths = Array.from(allWithClass).filter((el) => {
      return Boolean(this.getElementClass(el));
    });

    elementPaths.forEach((path) => {
      const mouseenterHandler = (e) => this.showTooltip(e);
      const mousemoveHandler = (e) => this.updateTooltipPosition(e);
      const mouseleaveHandler = (e) => this.hideTooltip(e);

      path.addEventListener('mouseenter', mouseenterHandler);
      path.addEventListener('mousemove', mousemoveHandler);
      path.addEventListener('mouseleave', mouseleaveHandler);

      // Store references for cleanup
      this.eventListeners.push(
        { element: path, event: 'mouseenter', handler: mouseenterHandler },
        { element: path, event: 'mousemove', handler: mousemoveHandler },
        { element: path, event: 'mouseleave', handler: mouseleaveHandler },
      );
    });
  }

  bindWindowEvents() {
    // Hide tooltip when window is resized
    const resizeHandler = () => {
      if (this.tooltip && this.tooltip.style.display !== 'none') {
        // Cancel any scheduled hiding
        if (this.hideTimeout) {
          clearTimeout(this.hideTimeout);
          this.hideTimeout = null;
        }
        this.hideTooltip();
      }
    };

    // Hide tooltip when scrolling
    const scrollHandler = () => {
      if (this.tooltip && this.tooltip.style.display !== 'none') {
        // Cancel any scheduled hiding
        if (this.hideTimeout) {
          clearTimeout(this.hideTimeout);
          this.hideTimeout = null;
        }
        this.hideTooltip();
      }
    };

    // Close selection list on ESC
    const keydownHandler = (e) => {
      if (e.key === 'Escape') {
        this.closeSelectionList();
      }
    };

    window.addEventListener('resize', resizeHandler);
    window.addEventListener('scroll', scrollHandler);
    window.addEventListener('keydown', keydownHandler);

    // Store references for cleanup
    this.eventListeners.push(
      { element: window, event: 'resize', handler: resizeHandler },
      { element: window, event: 'scroll', handler: scrollHandler },
      { element: window, event: 'keydown', handler: keydownHandler },
    );
  }

  bindSelectionListTriggers() {
    // Open trigger
    const openBtn = document.querySelector('.open_floor_select');
    if (openBtn) {
      const openHandler = (e) => {
        e.preventDefault();
        this.openSelectionList();
      };
      openBtn.addEventListener('click', openHandler);
      this.eventListeners.push({
        element: openBtn,
        event: 'click',
        handler: openHandler,
      });
    }

    // Overlay click to close
    const overlay = document.querySelector('.selection-list-overlay');
    if (overlay) {
      const overlayHandler = (e) => {
        e.preventDefault();
        this.closeSelectionList();
      };
      overlay.addEventListener('click', overlayHandler);
      this.eventListeners.push({
        element: overlay,
        event: 'click',
        handler: overlayHandler,
      });
    }
  }

  showTooltip(event) {
    // Check if component is initialized
    if (!this.isInitialized) {
      return;
    }

    // If it's a touch device, don't show tooltip
    if (this.isTouchDevice) {
      return;
    }

    const path = event.target;

    // Cancel tooltip hiding if it was scheduled
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }

    // Don't show tooltip for disabled elements
    if (path.classList.contains('disabled')) {
      return;
    }

    // Try to get element class directly from hovered element
    const elementClass = this.getElementClass(path);

    if (!elementClass || !this.tooltipData[elementClass]) {
      return;
    }

    // Highlight all elements sharing this class
    const svg = document.querySelector(this.config.svgSelector);
    if (svg) {
      const sameClassElements = svg.querySelectorAll(`.${elementClass}`);
      this.highlightGroup(sameClassElements, true);
    }

    const elementInfo = this.tooltipData[elementClass];

    // Update name
    this.tooltip.querySelector('.element_name').textContent =
      elementInfo.name || '';

    // Rows
    const statusRow = this.tooltip.querySelector('.tooltip_close.status');
    const roomsRow = this.tooltip.querySelector('.tooltip_close.count');
    const areaRow = this.tooltip.querySelector('.tooltip_close.area');
    const priceRow = this.tooltip.querySelector('.tooltip_close.price');

    // Status
    if (statusRow) {
      const labelEl = statusRow.querySelector('.status-text');
      const valueEl = statusRow.querySelector('.count-text');
      if (elementInfo.status) {
        if (labelEl) labelEl.textContent = 'Stav';
        if (valueEl) valueEl.textContent = elementInfo.status;
        statusRow.style.display = 'flex';
      } else {
        statusRow.style.display = 'none';
      }
    }

    // Rooms (supports `rooms` or fallback to `count` as provided earlier)
    if (roomsRow) {
      const labelEl = roomsRow.querySelector('.status-text');
      const valueEl = roomsRow.querySelector('.count-text');
      const roomsValue = elementInfo.rooms ?? elementInfo.count;
      if (roomsValue) {
        if (labelEl) labelEl.textContent = 'Počet izieb';
        if (valueEl) valueEl.textContent = roomsValue;
        roomsRow.style.display = 'flex';
      } else {
        roomsRow.style.display = 'none';
      }
    }

    // Area
    if (areaRow) {
      const labelEl = areaRow.querySelector('.status-text');
      const valueEl = areaRow.querySelector('.count-text');
      if (elementInfo.area) {
        if (labelEl) labelEl.textContent = 'Výmera';
        if (valueEl) valueEl.textContent = elementInfo.area;
        areaRow.style.display = 'flex';
      } else {
        areaRow.style.display = 'none';
      }
    }

    // Price
    if (priceRow) {
      const labelEl = priceRow.querySelector('.status-text');
      const valueEl = priceRow.querySelector('.count-text');
      if (elementInfo.price) {
        if (labelEl) labelEl.textContent = 'Cena s DPH';
        if (valueEl) valueEl.textContent = elementInfo.price;
        priceRow.style.display = 'flex';
      } else {
        priceRow.style.display = 'none';
      }
    }

    // Show tooltip with animation
    this.tooltip.style.display = 'block';
    this.updateTooltipPosition(event);

    // Add class for animation
    requestAnimationFrame(() => {
      this.tooltip.classList.add('show');
    });
  }

  updateTooltipPosition(event) {
    if (
      !this.isInitialized ||
      !this.tooltip ||
      this.tooltip.style.display === 'none'
    )
      return;

    // Check if event has required properties
    if (
      !event ||
      typeof event.clientX !== 'number' ||
      typeof event.clientY !== 'number'
    ) {
      console.warn('Invalid event object in updateTooltipPosition');
      return;
    }

    // Position tooltip relative to cursor in browser window
    const x = event.clientX + 10; // 10px to the right of cursor
    const y = event.clientY - 10; // 10px above cursor

    // Check if tooltip goes beyond screen boundaries
    const tooltipWidth = this.tooltip.offsetWidth || 280;
    const tooltipHeight = this.tooltip.offsetHeight || 100;

    let finalX = x;
    let finalY = y;

    // If tooltip goes beyond right edge of screen
    if (x + tooltipWidth > window.innerWidth) {
      finalX = event.clientX - tooltipWidth - 10; // show to the left of cursor
    }

    // If tooltip goes beyond bottom edge of screen
    if (y + tooltipHeight > window.innerHeight) {
      finalY = event.clientY - tooltipHeight - 10; // show above cursor
    }

    // If tooltip goes beyond top edge of screen
    if (finalY < 0) {
      finalY = event.clientY + 20; // show below cursor
    }

    // If tooltip goes beyond left edge of screen
    if (finalX < 0) {
      finalX = 10; // minimum offset from left edge
    }

    this.tooltip.style.left = `${finalX}px`;
    this.tooltip.style.top = `${finalY}px`;
  }

  hideTooltip() {
    // Check if component is initialized
    if (!this.isInitialized) {
      return;
    }

    // If it's a touch device, don't hide tooltip
    if (this.isTouchDevice) {
      return;
    }

    // Remove highlight from all groups
    this.removeAllHighlights();

    if (!this.tooltip) return;
    this.tooltip.style.display = 'none';
  }

  getElementClass(path) {
    // Get element class from class attribute
    const classList = path.className.baseVal || path.className;
    const classes = classList.split(' ');

    // Look for class that contains element information
    for (const className of classes) {
      if (this.tooltipData[className]) {
        return className;
      }
    }

    return null;
  }

  // Method to populate selection list with JSON data
  populateSelectionList() {
    // Find the selection list - it's at the end of the page
    const selectionList = document.querySelector('.selection-list-list');
    if (!selectionList) {
      return;
    }

    // Clear existing items
    selectionList.innerHTML = '';

    // Prepare sortable entries
    const entries = Object.entries(this.tooltipData);
    const order = { free: 0, reserv: 1, prepare: 2, sold: 3 };

    entries.sort(([, a], [, b]) => {
      const aKey = a.statusClass || 'sold';
      const bKey = b.statusClass || 'sold';
      const aIdx = order[aKey] ?? 3;
      const bIdx = order[bKey] ?? 3;
      if (aIdx !== bIdx) return aIdx - bIdx;
      // secondary sort by name for stability
      return String(a.name || '').localeCompare(String(b.name || ''));
    });

    // Create list items from JSON data
    entries.forEach(([key, data]) => {
      const listItem = document.createElement('li');
      listItem.className = 'selection-list-item';

      // Apply status class if exists
      if (data.statusClass) {
        listItem.classList.add(data.statusClass);
      }

      const link = document.createElement('a');
      link.href = '#';
      link.dataset.targetClass = key; // for potential navigation/highlight

      // Compose rows similar to tooltip structure
      const roomsValue = data.rooms ?? data.count ?? '';
      const areaValue = data.area ?? '';
      const priceValue = data.price ?? '';

      link.innerHTML = `
        <span class="selection-name">${data.name ?? ''}</span>
        <div class="selection-info">
          ${
            data.status
              ? `<div class="row status"><span>Stav</span><span>${data.status}</span></div>`
              : ''
          }
          ${
            roomsValue
              ? `<div class="row rooms"><span>Počet izieb</span><span>${roomsValue}</span></div>`
              : ''
          }
          ${
            areaValue
              ? `<div class="row area"><span>Výmera</span><span>${areaValue}</span></div>`
              : ''
          }
          ${
            priceValue
              ? `<div class="row price"><span>Cena s DPH</span><span>${priceValue}</span></div>`
              : ''
          }
        </div>
      `;

      listItem.appendChild(link);
      selectionList.appendChild(listItem);
    });
  }

  // Method to handle touch fallback visibility
  handleTouchFallback() {
    const touchFallback = document.querySelector('.svg-touch-fallback');
    if (!touchFallback) {
      return;
    }

    if (this.isTouchDevice) {
      touchFallback.style.display = 'block';

      // Add click handler to open selection list
      const button = touchFallback.querySelector('.svg-touch-fallback-button');
      if (button) {
        const buttonHandler = (e) => {
          e.preventDefault();
          this.openSelectionList();
        };
        button.addEventListener('click', buttonHandler);
        this.eventListeners.push({
          element: button,
          event: 'click',
          handler: buttonHandler,
        });
      }
    } else {
      touchFallback.style.display = 'none';
    }
  }

  // Method to open selection list
  openSelectionList() {
    const selectionListWrap = document.querySelector('.selection-list-wrap');
    if (selectionListWrap) {
      selectionListWrap.style.display = 'flex';
    }
  }

  // Method to close selection list
  closeSelectionList() {
    const selectionListWrap = document.querySelector('.selection-list-wrap');
    if (selectionListWrap) {
      selectionListWrap.style.display = 'none';
    }
  }

  // Method to apply status classes to SVG elements
  applyStatusClasses() {
    // Check that SVG selector is specified
    if (!this.config.svgSelector) {
      console.error('svgSelector is required in config');
      return;
    }

    const svg = document.querySelector(this.config.svgSelector);
    if (!svg) {
      return;
    }

    // Apply based on tooltipData keys directly
    Object.entries(this.tooltipData).forEach(([key, data]) => {
      if (!data || !data.statusClass) return;
      const elements = svg.querySelectorAll(`.${key}`);
      elements.forEach((el) => {
        el.classList.remove('free', 'reserv', 'sold', 'prepare');
        el.classList.add(data.statusClass);
      });
    });
  }

  // Get floor group class from path element
  getFloorGroup(path) {
    const group = path.closest('g[id]');
    if (!group) return null;

    // Map group IDs to floor classes
    const floorMap = {
      5: 'fifth_floor',
      4: 'fourth_floor',
      3: 'third_floor',
      2: 'second_floor',
      1: 'first_floor',
    };

    return floorMap[group.id] || null;
  }

  // Get all paths in a specific floor group
  getAllPathsInGroup(floorGroup) {
    const svg = document.querySelector(this.config.svgSelector);
    if (!svg) return [];

    return svg.querySelectorAll(`.${floorGroup} path`);
  }

  // Highlight or unhighlight a group of paths
  highlightGroup(paths, highlight) {
    paths.forEach((path) => {
      if (highlight) {
        path.classList.add('group-highlighted');
      } else {
        path.classList.remove('group-highlighted');
      }
    });
  }

  // Remove highlights from all groups
  removeAllHighlights() {
    const svg = document.querySelector(this.config.svgSelector);
    if (!svg) return;

    const highlightedPaths = svg.querySelectorAll('.group-highlighted');
    highlightedPaths.forEach((path) => {
      path.classList.remove('group-highlighted');
    });
  }

  // Get element class from floor group
  getElementClassFromFloor(floorGroup) {
    // Map floor groups to apartment classes
    const floorToApartmentMap = {
      fifth_floor: 'apartment_a_1_1',
      fourth_floor: 'apartment_a_1_2',
      third_floor: 'apartment_a_1_3',
      second_floor: 'apartment_b_1_1',
      first_floor: 'apartment_b_1_2',
    };

    return floorToApartmentMap[floorGroup] || null;
  }

  // Method to clean up event listeners and prevent memory leaks
  cleanup() {
    // Clear any pending timeouts
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }

    // Remove all stored event listeners
    this.eventListeners.forEach(({ element, event, handler }) => {
      if (element && typeof element.removeEventListener === 'function') {
        element.removeEventListener(event, handler);
      }
    });
    this.eventListeners = [];

    // Remove tooltip from DOM if it exists
    if (this.tooltip && this.tooltip.parentNode) {
      this.tooltip.parentNode.removeChild(this.tooltip);
      this.tooltip = null;
    }

    // Reset initialization state
    this.isInitialized = false;
  }
}
