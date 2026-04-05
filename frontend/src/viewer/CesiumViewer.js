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
    navigationHelpButton: true,
    baseLayerPicker: false,
    geocoder: false,
    homeButton: true,
    sceneModePicker: false,
    fullscreenButton: true,
    infoBox: false,
    selectionIndicator: false
  });

  // Enable depth testing against terrain
  viewer.scene.globe.depthTestAgainstTerrain = false;

  // Enhance visuals
  viewer.scene.skyAtmosphere.show = true;
  viewer.scene.fog.enabled = true;
  viewer.scene.fog.density = 0.0002;
  viewer.scene.msaaSamples = 4;
  viewer.scene.fxaa = true;
  viewer.resolutionScale = window.devicePixelRatio;
  viewer.scene.globe.enableLighting = true;

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
    osmBuildings.style = new Cesium.Cesium3DTileStyle({
      color: "color('#e8e0d0')"
    });
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

  // Add splat demo indicator
  viewer.entities.add({
    position: Cesium.Cartesian3.fromDegrees(90.4125, 23.8103, 10.0), // Approximate altitude
    ellipse: {
      semiMinorAxis: 100.0,
      semiMajorAxis: 100.0,
      material: new Cesium.ColorMaterialProperty(new Cesium.Color(0.0, 1.0, 1.0, 0.3)), // Cyan glow
      outline: true,
      outlineColor: Cesium.Color.CYAN
    },
    label: {
      text: "Gaussian Splat Demo\n(Garden Scene)",
      font: '14pt sans-serif',
      style: Cesium.LabelStyle.FILL_AND_OUTLINE,
      outlineWidth: 2,
      verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
      pixelOffset: new Cesium.Cartesian2(0, -20)
    }
  });

  // Set initial far camera position (space)
  viewer.camera.setView({
    destination: Cesium.Cartesian3.fromDegrees(90.4125, 23.8103, 10000000.0),
    orientation: {
      heading: 0.0,
      pitch: Cesium.Math.toRadians(-90.0),
      roll: 0.0
    }
  });

  // Smooth 3-second fly-in to Dhaka
  viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(90.4125, 23.8103, 800.0),
    orientation: {
      heading: 0.0,
      pitch: Cesium.Math.toRadians(-45.0),
      roll: 0.0
    },
    duration: 3.0,
    easingFunction: Cesium.EasingFunction.QUADRATIC_IN_OUT
  });

  return viewer;
}