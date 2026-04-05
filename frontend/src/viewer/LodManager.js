import * as Cesium from 'cesium';

/**
 * Manages distance-based LOD selection and VRAM caching for splats.
 */
export class LodManager {
  constructor(viewer, splatRenderer) {
    this.viewer = viewer;
    this.splatRenderer = splatRenderer;

    // LRU VRAM cache for loaded splat objects (Phase 5 placeholder)
    this.cache = new Map();
    this.maxCachedSplats = 10;
  }

  /**
   * Distance-based LOD selection logic
   * < 400m : Full High
   * 400-600m : High->Med cross-fade
   * 600m-1.8km : Full Medium
   * 1.8km-2.2km : Medium fading
   * > 2.2km : Dispose
   */
  updateLODs(cameraECEF, splats) {
    for (const splat of splats) {
      // In reality, centroidECEF would be from splat metadata
      const distance = Cesium.Cartesian3.distance(cameraECEF, splat.centroidECEF);

      if (distance > 2200) {
        this.disposeSplat(splat.id);
        continue;
      }

      // Check frustum culling before loading/rendering
      if (!this.isInFrustum(splat.bbox)) {
        continue;
      }

      let targetLOD = 'low';
      let opacity = 1.0;

      if (distance < 400) {
        targetLOD = 'high';
      } else if (distance < 600) {
        // High->Med smoothstep
        targetLOD = 'high_med_blend';
        // Example alpha blend ratio calculation for crossfade
        const t = (distance - 400) / 200; // 0 to 1
        const blend = t * t * (3 - 2 * t); // smoothstep
        // In the real impl, we would render both LODs and blend them based on this ratio.
      } else if (distance < 1800) {
        targetLOD = 'medium';
      } else if (distance < 2200) {
        targetLOD = 'medium';
        // Medium fading out
        const t = (distance - 1800) / 400; // 0 to 1
        opacity = 1.0 - (t * t * (3 - 2 * t));
      }

      this.loadSplatLOD(splat, targetLOD, opacity);
    }
  }

  isInFrustum(bbox) {
    // Frustum culling logic placeholder.
    // Uses Cesium.CullingVolume to check if the bounding sphere of the splat is visible.
    const camera = this.viewer.camera;
    const cullingVolume = camera.frustum.computeCullingVolume(camera.positionWC, camera.directionWC, camera.upWC);
    // return cullingVolume.computeVisibility(new Cesium.BoundingSphere(...)) !== Cesium.Intersect.OUTSIDE;
    return true; // Mock true for Phase 5
  }

  loadSplatLOD(splat, lodLevel, opacity) {
    const key = `${splat.id}_${lodLevel}`;
    if (!this.cache.has(key)) {
      if (this.cache.size >= this.maxCachedSplats) {
        this.evictOldest();
      }

      // Simulate loading the splat (in reality this fetches .spz and loads into gsplat.js)
      const mockSplatData = { id: splat.id, lod: lodLevel, timestamp: Date.now() };
      this.cache.set(key, mockSplatData);
      console.log(`[LodManager] Loaded ${key} into VRAM`);
    } else {
      // Update access time for LRU
      const data = this.cache.get(key);
      data.timestamp = Date.now();
    }

    // Set render opacity for crossfade
    // this.splatRenderer.setSplatOpacity(key, opacity);
  }

  evictOldest() {
    let oldestKey = null;
    let oldestTime = Infinity;

    for (const [key, data] of this.cache.entries()) {
      if (data.timestamp < oldestTime) {
        oldestTime = data.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.disposeSplat(oldestKey);
    }
  }

  disposeSplat(key) {
    if (this.cache.has(key)) {
      // Real implementation would call splatRenderer.disposeSplat(key) to free GPU buffers
      this.cache.delete(key);
      console.log(`[LodManager] Disposed ${key} from VRAM`);
    }
  }
}
