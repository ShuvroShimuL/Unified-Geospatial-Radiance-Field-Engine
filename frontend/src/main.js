import * as Cesium from 'cesium';
import { initViewer } from './viewer/CesiumViewer.js';
import { Compositor } from './viewer/Compositor.js';
import { RagClient } from './rag/RagClient.js';
import { InfoPanel } from './ui/InfoPanel.js';

async function bootstrap() {
  const viewer = await initViewer('cesiumContainer');
  console.log('Cesium viewer initialized');

  const compositor = new Compositor(viewer);
  console.log('Compositor initialized with placeholder rotating cube');

  // Initialize RAG Client and UI
  const ragClient = new RagClient();
  const infoPanel = new InfoPanel('infoPanel');

  // Test Authentication (hardcoded logic matching Phase 3 .env spec)
  try {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

    // Explicitly read Vite env vars without relying solely on OR fallbacks if Vercel sets them to empty string
    const uname = import.meta.env.VITE_TEST_USERNAME ? import.meta.env.VITE_TEST_USERNAME : 'admin';
    const pwd = import.meta.env.VITE_TEST_PASSWORD ? import.meta.env.VITE_TEST_PASSWORD : 'changeme';

    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: uname,
        password: pwd
      })
    });

    if (loginRes.ok) {
      const { token } = await loginRes.json();
      ragClient.setToken(token);
      console.log('Successfully authenticated for RAG queries.');
    } else {
      console.warn('Authentication failed, RAG will not work.');
    }
  } catch (e) {
    console.error('Failed to authenticate with backend', e);
  }

  // Update Coordinates and Compass Overlay
  const coordsDisplay = document.getElementById('coords-display');
  const compassIcon = document.getElementById('compass-icon');
  viewer.scene.postRender.addEventListener(() => {
    const position = viewer.camera.positionCartographic;
    const lat = Cesium.Math.toDegrees(position.latitude).toFixed(5);
    const lon = Cesium.Math.toDegrees(position.longitude).toFixed(5);
    const alt = Math.round(position.height);
    coordsDisplay.textContent = `Lat: ${lat}°, Lon: ${lon}°, Alt: ${alt}m`;

    // Rotate compass
    if (compassIcon) {
      const heading = Cesium.Math.toDegrees(viewer.camera.heading);
      compassIcon.style.transform = `rotate(${heading}deg)`;
    }
  });

  // Compass Click: Reset North
  const compassContainer = document.getElementById('compass-container');
  if (compassContainer) {
    compassContainer.addEventListener('click', () => {
      const center = viewer.camera.position;
      viewer.camera.flyTo({
        destination: center,
        orientation: {
          heading: 0.0,
          pitch: viewer.camera.pitch,
          roll: 0.0
        },
        duration: 1.0
      });
    });
  }

  // Setup Search Bar
  const searchInput = document.getElementById('location-search');
  const searchBtn = document.getElementById('search-btn');
  let currentSearchPin = null;

  const flyToLocation = (lat, lon, displayName) => {
    if (currentSearchPin) {
      viewer.entities.remove(currentSearchPin);
      currentSearchPin = null;
    }
    const pinBuilder = new Cesium.PinBuilder();
    currentSearchPin = viewer.entities.add({
      position: Cesium.Cartesian3.fromDegrees(lon, lat),
      billboard: {
        image: pinBuilder.fromColor(Cesium.Color.RED, 48).toDataURL(),
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
        disableDepthTestDistance: Number.POSITIVE_INFINITY
      },
      label: {
        text: displayName,
        font: '14pt sans-serif',
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        outlineWidth: 2,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        pixelOffset: new Cesium.Cartesian2(0, -50),
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
        disableDepthTestDistance: Number.POSITIVE_INFINITY
      }
    });

    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(lon, lat, 1500),
      orientation: {
        heading: 0.0,
        pitch: Cesium.Math.toRadians(-45.0),
        roll: 0.0
      },
      duration: 2.0
    });
  };

  const performSearch = async () => {
    const query = searchInput.value.trim();
    if (!query) return;

    // Detect "lat, lon" pattern e.g. "23.7619, 90.4234"
    const latLonMatch = query.match(/^(-?\d+\.?\d*)[,\s]+(-?\d+\.?\d*)$/);
    if (latLonMatch) {
      const lat = parseFloat(latLonMatch[1]);
      const lon = parseFloat(latLonMatch[2]);
      flyToLocation(lat, lon, 'Custom Location');
      return;
    }

    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), 10000);
    const searchSpinner = document.getElementById('search-spinner');
    if (searchSpinner) searchSpinner.style.display = 'block';

    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json`, {
        signal: abortController.signal
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
         throw new Error("Search geocoding failed");
      }

      const results = await response.json();
      if (results && results.length > 0) {
        const result = results[0];
        const lat = parseFloat(result.lat);
        const lon = parseFloat(result.lon);
        const displayName = result.display_name.split(',')[0];
        flyToLocation(lat, lon, displayName);
      } else {
        alert("Location not found");
      }
    } catch (e) {
      if (e.name === 'AbortError') {
         alert("Search geocoding timed out after 10s. Please try again.");
      } else {
         alert("Search failed: " + e.message);
      }
      console.error("Search failed", e);
    } finally {
      if (searchSpinner) searchSpinner.style.display = 'none';
    }
  };

  searchBtn.addEventListener('click', performSearch);
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') performSearch();
  });

  // Setup Layer Toggle (Satellite vs Night Mode)
  const layerToggleBtn = document.getElementById('layer-toggle');
  let isNightMode = false;
  let defaultImagery = viewer.imageryLayers.get(0);
  let nightImagery = null;

  if (layerToggleBtn) {
    layerToggleBtn.addEventListener('click', async () => {
      isNightMode = !isNightMode;
      if (isNightMode) {
        if (!nightImagery) {
          // Use OpenStreetMap dark style (CartoDB Dark Matter)
          const provider = await Cesium.IonImageryProvider.fromAssetId(3812);
          nightImagery = new Cesium.ImageryLayer(provider);
          viewer.imageryLayers.add(nightImagery);
        }
        nightImagery.show = true;
        if (defaultImagery) defaultImagery.show = false;

        // Change OSM building color for night
        for (let i = 0; i < viewer.scene.primitives.length; i++) {
          const prim = viewer.scene.primitives.get(i);
          if (prim instanceof Cesium.Cesium3DTileset) {
            prim.style = new Cesium.Cesium3DTileStyle({ color: "color('#1a1a2e')" });
          }
        }
        viewer.scene.fog.density = 0.0001; // Reduce fog at night

        layerToggleBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`;
      } else {
        if (nightImagery) nightImagery.show = false;
        if (defaultImagery) defaultImagery.show = true;

        // Revert OSM building color for day
        for (let i = 0; i < viewer.scene.primitives.length; i++) {
          const prim = viewer.scene.primitives.get(i);
          if (prim instanceof Cesium.Cesium3DTileset) {
            prim.style = new Cesium.Cesium3DTileStyle({ color: "color('#e8e0d0')" });
          }
        }
        viewer.scene.fog.density = 0.0002;

        layerToggleBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;
      }
    });
  }

  // Setup 2D/3D Mode Toggle
  const modeToggleBtn = document.getElementById('mode-toggle');
  let is3DMode = true;
  if (modeToggleBtn) {
    modeToggleBtn.addEventListener('click', () => {
      is3DMode = !is3DMode;
      if (is3DMode) {
        viewer.scene.morphTo3D();
        modeToggleBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>`;
      } else {
        viewer.scene.morphTo2D();
        modeToggleBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1 4-10z"></path></svg>`;
      }
    });
  }

  // Fly to Demo Button
  const demoFlyBtn = document.getElementById('demo-fly-btn');
  if (demoFlyBtn) {
    demoFlyBtn.addEventListener('click', () => {
      viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(90.4125, 23.8103, 30.0),
        orientation: {
          heading: 0.0,
          pitch: Cesium.Math.toRadians(-20.0),
          roll: 0.0
        },
        duration: 3.0,
        easingFunction: Cesium.EasingFunction.QUADRATIC_IN_OUT
      });
    });
  }

  // Setup click handler
  const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
  let currentClickEntity = null;

  handler.setInputAction(async (click) => {
    // Raycast to find the clicked position on the globe
    const ray = viewer.camera.getPickRay(click.position);
    const position = viewer.scene.globe.pick(ray, viewer.scene);

    if (position) {
      // Show glowing pin
      if (currentClickEntity) {
        viewer.entities.remove(currentClickEntity);
      }

      const startTime = performance.now();
      const pinBuilder = new Cesium.PinBuilder();
      const pinImage = pinBuilder.fromColor(Cesium.Color.RED, 48).toDataURL();

      currentClickEntity = viewer.entities.add({
        position: position,
        billboard: {
          image: pinImage,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          scale: new Cesium.CallbackProperty(() => {
            const elapsed = (performance.now() - startTime) / 1000.0;
            // Pulse 3 times over 3 seconds (1 pulse per second), then stay static at 1.0
            if (elapsed < 3.0) {
              const pulse = Math.sin(elapsed * Math.PI * 2.0); // 0 to 1 to 0 to -1 to 0
              return 1.0 + 0.2 * pulse;
            }
            return 1.0;
          }, false),
          color: new Cesium.CallbackProperty(() => {
            const elapsed = (performance.now() - startTime) / 1000.0;
            // Glowing red
            if (elapsed < 3.0) {
              const pulse = Math.abs(Math.sin(elapsed * Math.PI * 2.0));
              const intensity = 1.0 + 0.5 * pulse;
              return new Cesium.Color(intensity, 0.0, 0.0, 1.0);
            }
            return Cesium.Color.WHITE; // Image has its own red color, use WHITE to render it natively
          }, false)
        }
      });

      // Store reference to viewer to remove entity when panel closes
      infoPanel.currentClickEntity = currentClickEntity;
      infoPanel.viewer = viewer;

      // Convert ECEF to Cartographic (WGS84)
      const cartographic = Cesium.Cartographic.fromCartesian(position);
      const lon = Cesium.Math.toDegrees(cartographic.longitude);
      const lat = Cesium.Math.toDegrees(cartographic.latitude);

      const query = "What grows here and what is the NDVI?";

      infoPanel.showLoading();
      const ragToast = document.getElementById('rag-toast');
      if (ragToast) ragToast.style.display = 'block';

      try {
        const result = await ragClient.query(lat, lon, query);
        infoPanel.showResult(lat, lon, query, result.response, result.cached);
      } catch (err) {
        infoPanel.showError(err.message);
      } finally {
        if (ragToast) ragToast.style.display = 'none';
      }
    }
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

  // Auto-hide navigation help panel after 5 seconds
  setTimeout(() => {
    // The actual button class is 'cesium-navigation-button' but it has a specific wrapper for state
    const helpButton = document.querySelector('.cesium-navigationHelpButton-wrapper');
    if (helpButton && !helpButton.classList.contains('cesium-navigationHelpButton-wrapper-hide')) {
      // simulate a click to toggle it off if it's open
      const btn = document.querySelector('.cesium-navigationHelpButton-wrapper .cesium-navigation-button');
      if (btn && helpButton.style.display !== 'none' && document.querySelector('.cesium-navigation-help')) {
         btn.click();
      }
    }
  }, 5000);
}

bootstrap().catch(console.error);