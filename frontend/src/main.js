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
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: import.meta.env.VITE_TEST_USERNAME || 'admin',
        password: import.meta.env.VITE_TEST_PASSWORD || 'changeme'
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

  // Setup click handler
  const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
  handler.setInputAction(async (click) => {
    // Raycast to find the clicked position on the globe
    const ray = viewer.camera.getPickRay(click.position);
    const position = viewer.scene.globe.pick(ray, viewer.scene);

    if (position) {
      // Convert ECEF to Cartographic (WGS84)
      const cartographic = Cesium.Cartographic.fromCartesian(position);
      const lon = Cesium.Math.toDegrees(cartographic.longitude);
      const lat = Cesium.Math.toDegrees(cartographic.latitude);

      const query = "What grows here and what is the NDVI?";

      infoPanel.showLoading();
      try {
        const result = await ragClient.query(lat, lon, query);
        infoPanel.showResult(lat, lon, query, result.response, result.cached);
      } catch (err) {
        infoPanel.showError(err.message);
      }
    }
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
}

bootstrap().catch(console.error);