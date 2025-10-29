/**
 * District Map Initialization
 * Global function for Google Maps API callback
 */

// Global function to initialize district map
window.initDistrictMap = function () {
  // Check if we're on the district-map page
  const mapContainer = document.querySelector('#map');
  if (!mapContainer) {
    return;
  }

  // Check if DistrictMap class is available
  if (typeof DistrictMap === 'undefined') {
    console.error(
      'DistrictMap class not found. Make sure the component is loaded.',
    );
    return;
  }

  // Initialize the district map
  new DistrictMap();
};
