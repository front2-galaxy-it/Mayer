/**
 * SVG Tooltips Component
 * Manages tooltip display for SVG map elements
 */

export default class SvgTooltips {
  constructor(config = {}) {
    this.tooltip = null;
    this.currentElement = null;
    this.hideTimeout = null;
    this.tooltipData = {};

    // Configuration
    this.config = {
      tooltipSelector: '.tooltip', // Default value
      ...config, // Other settings must be passed when creating an instance
    };

    // Check if device is touch-enabled
    this.isTouchDevice =
      'ontouchstart' in window || navigator.maxTouchPoints > 0;

    // If it's a touch device, don't initialize tooltips
    if (this.isTouchDevice) {
      return;
    }

    this.loadTooltipData();
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

      // Initialize tooltips only after loading data
      this.init();
    } catch (error) {
      console.error('Error loading tooltip data:', error);
      console.log('Falling back to embedded data...');

      this.init();
    }
  }

  init() {
    // If it's a touch device, don't initialize tooltips
    if (this.isTouchDevice) {
      return;
    }

    this.createTooltip();
    this.bindEvents();
    this.bindWindowEvents();
  }

  createTooltip() {
    // Create tooltip if it doesn't exist yet
    if (!document.querySelector(this.config.tooltipSelector)) {
      this.tooltip = document.createElement('div');
      this.tooltip.className = 'tooltip';
      this.tooltip.style.display = 'none';

      this.tooltip.innerHTML = `
                <span class="tooltip_text element_name"></span>
                <div class="divider"></div>
                <div class="tooltip_close status">
                    <span class="status-text"></span>
                    <span class="count-text"></span>
                </div>
            `;

      // Add tooltip to body for proper positioning
      document.body.appendChild(this.tooltip);
    } else {
      this.tooltip = document.querySelector(this.config.tooltipSelector);
    }
  }

  bindEvents() {
    // Check that selectors are specified
    if (!this.config.svgSelector || !this.config.pathSelector) {
      console.error('svgSelector and pathSelector are required in config');
      return;
    }

    const svg = document.querySelector(this.config.svgSelector);
    if (!svg) {
      console.error(`SVG element not found with selector: ${this.config.svgSelector}`);
      return;
    }

    // Find all element paths
    const elementPaths = svg.querySelectorAll(this.config.pathSelector);

    elementPaths.forEach((path, index) => {
      path.addEventListener('mouseenter', (e) => this.showTooltip(e));
      path.addEventListener('mousemove', (e) => this.updateTooltipPosition(e));
      path.addEventListener('mouseleave', (e) => this.hideTooltip(e));
    });
  }

  bindWindowEvents() {
    // Hide tooltip when window is resized
    window.addEventListener('resize', () => {
      if (this.tooltip && this.tooltip.style.display !== 'none') {
        // Cancel any scheduled hiding
        if (this.hideTimeout) {
          clearTimeout(this.hideTimeout);
          this.hideTimeout = null;
        }
        this.hideTooltip();
      }
    });

    // Hide tooltip when scrolling
    window.addEventListener('scroll', () => {
      if (this.tooltip && this.tooltip.style.display !== 'none') {
        // Cancel any scheduled hiding
        if (this.hideTimeout) {
          clearTimeout(this.hideTimeout);
          this.hideTimeout = null;
        }
        this.hideTooltip();
      }
    });
  }

  showTooltip(event) {
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

    const elementClass = this.getElementClass(path);

    if (!elementClass || !this.tooltipData[elementClass]) {
      return;
    }

    const elementInfo = this.tooltipData[elementClass];
    this.currentElement = elementClass;

    // Update tooltip content
    this.tooltip.querySelector('.element_name').textContent = elementInfo.name;
    this.tooltip.querySelector('.status-text').textContent = elementInfo.status;
    this.tooltip.querySelector('.count-text').textContent = elementInfo.count;

    // Show tooltip with animation
    this.tooltip.style.display = 'block';
    this.updateTooltipPosition(event);

    // Add class for animation
    requestAnimationFrame(() => {
      this.tooltip.classList.add('show');
    });
  }

  updateTooltipPosition(event) {
    if (!this.tooltip || this.tooltip.style.display === 'none') return;

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

  hideTooltip(event) {
    // If it's a touch device, don't hide tooltip
    if (this.isTouchDevice) {
      return;
    }

    if (!this.tooltip) return;
    this.tooltip.style.display = 'none';
    this.currentElement = null;
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

  // Method for updating element data
  updateElementData(elementClass, newData) {
    if (this.tooltipData[elementClass]) {
      this.tooltipData[elementClass] = {
        ...this.tooltipData[elementClass],
        ...newData,
      };
    }
  }

  // Method for adding new element
  addElementData(elementClass, data) {
    this.tooltipData[elementClass] = data;
  }
}
