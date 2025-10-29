/**
 * District Map Component
 * Manages district map functionality including dropdown and location selection
 */

import { fadeIn, fadeOut } from '../utils/fade.js';

export default class DistrictMap {
  constructor() {
    this.mapInstance = null;
    this.init();
  }

  init() {
    // Wait for Google Maps API to load
    if (typeof google !== 'undefined') {
      this.initializeMap();
    } else {
      // Wait for Google Maps API
      window.initDistrictMap = () => this.initializeMap();
    }
  }

  initializeMap() {
    // Check if GoogleMaps class is available
    if (typeof GoogleMaps === 'undefined') {
      console.error(
        'GoogleMaps class not found. Make sure the component is loaded.',
      );
      return;
    }

    // Initialize the map
    this.mapInstance = new GoogleMaps({
      mapContainer: '#map',
      dataFile: '/data/map-locations.json',
      center: { lat: 48.43997244427197, lng: 17.043003287120033 },
      zoom: 14,
    });

    // Setup filters after map is loaded
    setTimeout(() => {
      this.setupMapFilters();
    }, 1000);
  }

  setupMapFilters() {
    this.setupTimeFilter();
    this.setupDropdownToggle();
    this.setupSelectionListToggle();
  }

  setupTimeFilter() {
    const timeFilter = document.getElementById('time-filter');
    if (timeFilter && this.mapInstance) {
      timeFilter.addEventListener('change', (e) => {
        const maxMinutes =
          e.target.value === 'all' ? Infinity : parseInt(e.target.value);
        this.mapInstance.filterByBikeTime(maxMinutes);
      });
    }
  }

  setupDropdownToggle() {
    const dropdownToggle = document.getElementById('map-dropdown-toggle');
    const dropdownContent = document.getElementById('map-dropdown-content');

    if (dropdownToggle && dropdownContent) {
      dropdownToggle.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();

        const isOpen = dropdownContent.style.display === 'block';

        if (isOpen) {
          this.closeDropdown();
        } else {
          this.openDropdown();
        }
      });
    }

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (dropdownContent && dropdownContent.style.display === 'block') {
        if (
          !dropdownContent.contains(e.target) &&
          !dropdownToggle.contains(e.target)
        ) {
          this.closeDropdown();
        }
      }
    });
  }

  setupSelectionListToggle() {
    const selectionButton = document.querySelector(
      '.svg-touch-fallback-button',
    );
    const selectionListWrap = document.querySelector('.selection-list-wrap');

    if (selectionButton && selectionListWrap) {
      selectionButton.addEventListener('click', (e) => {
        e.preventDefault();
        selectionListWrap.style.display =
          selectionListWrap.style.display === 'flex' ? 'none' : 'flex';
      });
    }

    // Close selection list when clicking overlay
    const selectionOverlay = document.querySelector('.selection-list-overlay');
    if (selectionOverlay) {
      selectionOverlay.addEventListener('click', () => {
        selectionListWrap.style.display = 'none';
      });
    }
  }

  openDropdown() {
    const dropdownContent = document.getElementById('map-dropdown-content');
    const dropdownToggle = document.getElementById('map-dropdown-toggle');

    if (dropdownContent && dropdownToggle) {
      dropdownToggle.classList.add('active');

      // Use fadeIn animation
      fadeIn(dropdownContent, 300, () => {});
    }
  }

  closeDropdown() {
    const dropdownContent = document.getElementById('map-dropdown-content');
    const dropdownToggle = document.getElementById('map-dropdown-toggle');

    if (dropdownContent && dropdownToggle) {
      // Remove active class from toggle
      dropdownToggle.classList.remove('active');

      // Use fadeOut animation
      fadeOut(dropdownContent, 300, () => {});
    }
  }
}
