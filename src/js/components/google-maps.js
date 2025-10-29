/**
 * Google Maps Component with Snazzy Maps integration
 * Manages map display with location markers and custom styling
 */

export default class GoogleMaps {
  constructor(config = {}) {
    this.map = null;
    this.markers = [];
    this.infoWindow = null;
    this.locations = [];
    this.snazzyMapStyle = null;

    // Configuration
    this.config = {
      mapContainer: '.map-container',
      dataFile: '/data/map-locations.json',
      apiKey: '',
      center: { lat: 48.43997244427197, lng: 17.043003287120033 },
      zoom: 14,
      mapId: null,
      ...config,
    };

    // Load data and initialize map
    this.loadMapData();
  }

  async loadMapData() {
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

      const data = await response.json();
      
      this.locations = data.locations || [];
      this.settings = data.settings || {};

      // Update center coordinates from data if available
      if (this.settings.centerCoordinates) {
        this.config.center = this.settings.centerCoordinates;
      }

      // Propagate mapId from data settings if provided
      if (this.settings.mapId) {
        this.config.mapId = this.settings.mapId;
      }

      // Initialize map after data is loaded
      this.initMap();
    } catch (error) {
      console.error('Error loading map data:', error);
      // Still try to initialize map with empty data
      this.locations = [];
      this.settings = {};
      this.initMap();
    }
  }

  async initMap() {
    // Check if Google Maps API is loaded
    if (typeof google === 'undefined') {
      console.error('Google Maps API is not loaded');
      return;
    }

    const mapContainer = document.querySelector(this.config.mapContainer);
    if (!mapContainer) {
      console.error('Map container not found');
      return;
    }

    // Load Snazzy Maps style
    const mapStyle = await this.loadSnazzyMapStyle();

    // Create map instance
    const mapOptions = {
      center: this.config.center,
      zoom: this.config.zoom,
      styles: mapStyle,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      zoomControl: false, 
      navigationControl: false,
      cameraControl:false
    };

    if (this.config.mapId) {
      mapOptions.mapId = this.config.mapId;
    }

    this.map = new google.maps.Map(mapContainer, mapOptions);

    // Create info window
    this.infoWindow = new google.maps.InfoWindow();

    // Add markers
    this.addMarkers();

    // Add custom project label marker if configured
    this.addProjectLabelMarker();

    // No category filter

    // Generate location list
    this.generateLocationList();
  }

  async loadSnazzyMapStyle() {
    try {
      const response = await fetch('/data/snazzy-map-styles.json', {
        cache: 'no-cache',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.mayerStyle;
    } catch (error) {
      console.error('Error loading Snazzy Maps style:', error);
      return this.getDefaultMapStyle();
    }
  }

  getDefaultMapStyle() {
    // Fallback style if Snazzy Maps style fails to load
    return [
      {
        featureType: 'water',
        elementType: 'geometry',
        stylers: [{ color: '#e9e9e9' }, { lightness: 17 }],
      },
      {
        featureType: 'landscape',
        elementType: 'geometry',
        stylers: [{ color: '#f5f5f5' }, { lightness: 20 }],
      },
      {
        featureType: 'road.highway',
        elementType: 'geometry.fill',
        stylers: [{ color: '#ffffff' }, { lightness: 17 }],
      },
      {
        featureType: 'road.highway',
        elementType: 'geometry.stroke',
        stylers: [{ color: '#ffffff' }, { lightness: 29 }, { weight: 0.2 }],
      },
      {
        featureType: 'road.arterial',
        elementType: 'geometry',
        stylers: [{ color: '#ffffff' }, { lightness: 18 }],
      },
      {
        featureType: 'road.local',
        elementType: 'geometry',
        stylers: [{ color: '#ffffff' }, { lightness: 16 }],
      },
      {
        featureType: 'poi',
        elementType: 'geometry',
        stylers: [{ color: '#f5f5f5' }, { lightness: 21 }],
      },
      {
        featureType: 'poi.park',
        elementType: 'geometry',
        stylers: [{ color: '#dedede' }, { lightness: 21 }],
      },
      {
        elementType: 'labels.text.stroke',
        stylers: [{ visibility: 'on' }, { color: '#ffffff' }, { lightness: 16 }],
      },
      {
        elementType: 'labels.text.fill',
        stylers: [{ saturation: 36 }, { color: '#333333' }, { lightness: 40 }],
      },
      {
        elementType: 'labels.icon',
        stylers: [{ visibility: 'off' }],
      },
      {
        featureType: 'transit',
        elementType: 'geometry',
        stylers: [{ color: '#f2f2f2' }, { lightness: 19 }],
      },
      {
        featureType: 'administrative',
        elementType: 'geometry.fill',
        stylers: [{ color: '#fefefe' }, { lightness: 20 }],
      },
      {
        featureType: 'administrative',
        elementType: 'geometry.stroke',
        stylers: [{ color: '#fefefe' }, { lightness: 17 }, { weight: 1.2 }],
      },
    ];
  }

  addMarkers() {
    const canUseAdvanced =
      !!this.config.mapId &&
      google.maps.marker &&
      typeof google.maps.marker.AdvancedMarkerElement === 'function';

    this.locations.forEach((location) => {
      let marker;
      if (canUseAdvanced) {
        const pin = this.createPin();
        marker = new google.maps.marker.AdvancedMarkerElement({
          position: location.coordinates,
          map: this.map,
          title: location.name,
          content: pin.element,
        });
      } else {
        marker = new google.maps.Marker({
          position: location.coordinates,
          map: this.map,
          title: location.name,
          icon: this.getLegacyMarkerIcon(),
        });
      }

      // Add click listener
      marker.addListener('click', () => {
        this.showInfoWindow(marker, location);
      });

      this.markers.push(marker);
    });
  }

  addProjectLabelMarker() {
    if (!this.settings || !this.settings.projectLabel) return;
    const { position, text } = this.settings.projectLabel;
    if (!position || typeof position.lat !== 'number' || typeof position.lng !== 'number') {
      return;
    }

    const labelEl = document.createElement('div');
    labelEl.className = 'project-label-marker';
    if (text) {
      const span = document.createElement('span');
      span.className = 'project-label-marker__text';
      span.textContent = String(text);
      labelEl.appendChild(span);
    }

    const canUseAdvanced =
      !!this.config.mapId &&
      google.maps.marker &&
      typeof google.maps.marker.AdvancedMarkerElement === 'function';

    if (canUseAdvanced) {
      new google.maps.marker.AdvancedMarkerElement({
        map: this.map,
        position,
        content: labelEl,
        title: text || '',
      });
    } else {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          const paddingX = 12;
          const font = '600 16px Align, Ease, Arial';
          ctx.font = font;
          const metrics = ctx.measureText(text || '');
          const w = Math.ceil(metrics.width) + paddingX * 2;
          const h = 28;
          canvas.width = w;
          canvas.height = h;
          ctx.fillStyle = '#424D1C';
          ctx.fillRect(0, 0, w, h);
          ctx.fillStyle = '#FFFFFF';
          ctx.font = font;
          ctx.textBaseline = 'middle';
          ctx.fillText(text || '', paddingX, h / 2);
          const url = canvas.toDataURL();
          new google.maps.Marker({
            map: this.map,
            position,
            title: text || '',
            icon: {
              url,
              anchor: new google.maps.Point(Math.floor(w / 2), Math.floor(h / 2)),
              scaledSize: new google.maps.Size(w, h),
            },
          });
        } catch (_) {
          new google.maps.Marker({ map: this.map, position, title: text || '' });
        }
    }
  }

  createPin() {
    const color = '#424D1C';
    const pin = new google.maps.marker.PinElement({
      background: color,
      borderColor: '#ffffff',
      glyph: '',
      glyphColor: '#ffffff',
      scale: 1.0,
    });
    return pin;
  }

  getLegacyMarkerIcon() {
    const color = '#424D1C';
    return {
      path: google.maps.SymbolPath.CIRCLE,
      fillColor: color,
      fillOpacity: 1,
      strokeColor: '#63683DE5',
      strokeWeight: 4,
      scale: 8,
    };
  }

  showInfoWindow(marker, location) {
    const content = this.createInfoWindowContent(location);
    this.infoWindow.setContent(content);
    this.infoWindow.open(this.map, marker);
    google.maps.event.addListenerOnce(this.infoWindow, 'domready', () => {
      const closeBtn = document.querySelector('.map-info-close');
      if (closeBtn) {
        const handler = () => this.infoWindow.close();
        closeBtn.addEventListener('click', handler, { once: true });
      }
    });
  }

  createInfoWindowContent(location) {
    return `
      <div class="map-info-window">
        <div class="map-info-header">
          <span class="map-info-title">${location.name}</span>
          <span class="map-info-divider">—</span>
          <span class="map-info-value">${location.bikeTime}</span>
        </div>
        <button type="button" class="map-info-close">
          <img src="./images/close.svg" alt="close" width="16" height="16">
        </button>
      </div>
    `;
  }

  // addCategoryFilter removed

  // Method to show only locations within specific time range
  filterByBikeTime(maxMinutes) {
    this.markers.forEach((marker, index) => {
      const location = this.locations[index];
      marker.setVisible(location.bikeTimeMinutes <= maxMinutes);
    });
  }

  

  // Method to center map on specific location
  centerOnLocation(locationId) {
    const location = this.locations.find(loc => loc.id === locationId);
    if (location) {
      this.map.setCenter(location.coordinates);
      this.map.setZoom(16);
    }
  }

  // Method to generate location list for district-map page
  generateLocationList() {
    
    const desktopList = document.querySelector('.district-map-items');
    const selectionList = document.querySelector('.selection-list-list');
    
    if (!desktopList && !selectionList) {
      return;
    }

    // Sort locations by bike time
    const sortedLocations = [...this.locations].sort((a, b) => a.bikeTimeMinutes - b.bikeTimeMinutes);
    

    const generateListHTML = (locations) => {
      return locations.map(location => `
        <button type="button" class="district-map-item" data-location-id="${location.id}">
          <span>${location.name}</span>
          <div class="ride-time">
            <span>${location.bikeTime}</span>
            <img src="./images/bike.svg" alt="bike icon" width="16" height="16">
          </div>
        </button>
      `).join('');
    };

    const generateSelectionListHTML = (locations) => {
      return locations.map(location => `
        <li class="selection-list-item">
          <a href="#" data-location-id="${location.id}">
            <span>${location.name}</span>
            <span>${location.bikeTime}</span>
          </a>
        </li>
      `).join('');
    };

    if (desktopList) {
      desktopList.innerHTML = generateListHTML(sortedLocations);
    }

    if (selectionList) {
      selectionList.innerHTML = generateSelectionListHTML(sortedLocations);
    }

    // Add click handlers to location items
    this.addLocationItemHandlers();
  }

  // Method to add click handlers to location items
  addLocationItemHandlers() {
    const locationItems = document.querySelectorAll('.district-map-item[data-location-id], .selection-list-item a[data-location-id]');
    
    locationItems.forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const locationId = item.dataset.locationId;
        this.centerOnLocation(locationId);
        
        // Find and click the corresponding marker
        const markerIndex = this.locations.findIndex(loc => loc.id === locationId);
        if (markerIndex !== -1 && this.markers[markerIndex]) {
          this.showInfoWindow(this.markers[markerIndex], this.locations[markerIndex]);
        }
        
        // Close selection list if it's open
        const selectionListWrap = document.querySelector('.selection-list-wrap');
        if (selectionListWrap) {
          selectionListWrap.style.display = 'none';
        }
        
        // Close dropdown if it's open
        const dropdownContent = document.getElementById('map-dropdown-content');
        const dropdownToggle = document.getElementById('map-dropdown-toggle');
        if (dropdownContent && dropdownContent.style.display === 'block') {
          // Use fadeOut animation if available
          if (typeof fadeOut !== 'undefined') {
            fadeOut(dropdownContent, 300);
          } else {
            dropdownContent.style.display = 'none';
          }
          dropdownToggle.classList.remove('active');
        }
      });
    });
  }
}
