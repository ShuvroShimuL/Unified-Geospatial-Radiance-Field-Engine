import * as Cesium from 'cesium';

/**
 * Initializes the Cesium viewer with terrain and OSM buildings.
 * @param {string} containerId - The ID of the HTML element to contain the viewer.
 * @returns {Promise<Cesium.Viewer>}
 */
export async function initViewer(containerId) {
  // Load token from Vite environment
  const token = import.meta.env.VITE_CESIUM_ION_TOKEN;
  if (token) {
    Cesium.Ion.defaultAccessToken = token;
  } else {
    console.warn('VITE_CESIUM_ION_TOKEN is not set. Using default token if available, else network errors may occur.');
  }

  const viewer = new Cesium.Viewer(containerId, {
    terrainProvider: undefined, // Will be set manually below
    animation: false,
    timeline: false,
    navigationHelpButton: false,
    baseLayerPicker: false,
    geocoder: false,
    homeButton: false,
    sceneModePicker: false,
    fullscreenButton: false,
    infoBox: false,
    selectionIndicator: false
  });

  // Init terrain with fallback
  try {
    const terrainProvider = await Cesium.CesiumTerrainProvider.fromIonAssetId(1); // World Terrain
    viewer.scene.terrainProvider = terrainProvider;
  } catch (error) {
    console.warn('Failed to load Cesium World Terrain. Falling back to EllipsoidTerrainProvider.', error);
    viewer.scene.terrainProvider = new Cesium.EllipsoidTerrainProvider();
  }

  // Init 3D Tiles (OSM Buildings)
  try {
    const osmBuildings = await Cesium.createOsmBuildingsAsync();
    viewer.scene.primitives.add(osmBuildings);
  } catch (error) {
    console.warn('Failed to load OSM Buildings.', error);
  }

  // Google Photorealistic 3D Tiles require a specific Google Maps API key in addition to the Cesium Ion token.
  // if (import.meta.env.VITE_USE_GOOGLE_TILES === 'true') {
  //    try {
  //        const googleTileset = await Cesium.createGooglePhotorealistic3DTileset();
  //        viewer.scene.primitives.add(googleTileset);
  //    } catch (e) {
  //        console.warn('Failed to load Google Photorealistic 3D Tiles', e);
  //    }
  // }

  // Initial camera position (optional, let's look at Dhaka for the seed data)
  viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(90.4125, 23.8103, 5000.0),
    duration: 0 // Instant jump
  });

  return viewer;
}