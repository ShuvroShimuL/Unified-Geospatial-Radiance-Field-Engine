import * as SPLAT from 'gsplat';

export class SplatRenderer {
  constructor() {
    this.renderer   = null;
    this.scene      = null;
    this.camera     = null;
    this.canvas     = null;
    this.isInitialized = false;
    this.loadedUrl  = null;
    this.isLoading  = false;
    this._onProgress = null;
  }

  onProgress(callback) {
    this._onProgress = callback;
  }

  async initialize(width, height) {
    // Ensure numeric width/height
    const w = Math.floor(width) || 1024;
    const h = Math.floor(height) || 768;

    // Create offscreen canvas
    this.canvas = new OffscreenCanvas(w, h);

    // Mock style to prevent gsplat errors when setting background
    this.canvas.style = {};
    this.canvas.clientWidth = w;
    this.canvas.clientHeight = h;

    // Initialize gsplat renderer on the offscreen canvas
    this.renderer = new SPLAT.WebGLRenderer(this.canvas);
    this.renderer.setSize(w, h);

    this.scene = new SPLAT.Scene();
    this.camera = new SPLAT.Camera();

    this.isInitialized = true;
    console.log('SplatRenderer initialized with gsplat.js');
  }

  async loadSplat(url) {
    if (this.isLoading) return;
    if (this.loadedUrl === url) return; // already loaded
    this.isLoading = true;
    console.log(`[SplatRenderer] Loading: ${url}`);
    try {
      // Clear previous scene
      this.scene = new SPLAT.Scene();

      await SPLAT.Loader.LoadAsync(url, this.scene, (progress) => {
        if (this._onProgress) this._onProgress(progress);
        console.log(`[SplatRenderer] ${(progress * 100).toFixed(1)}%`);
      });
      this.loadedUrl = url;
      console.log('[SplatRenderer] Loaded successfully');
    } catch (err) {
      console.error('[SplatRenderer] Load failed:', err);
      // Fallback: reset scene so compositor gets empty output (no crash)
      this.scene = new SPLAT.Scene();
      this.loadedUrl = null;
      throw err;
    } finally {
      this.isLoading = false;
    }
  }

  syncFromCesium(cesiumCamera) {
    if (!this.isInitialized) return;

    // Sync gsplat camera from Cesium camera
    // Apply RTE (relative-to-eye) transform
    const pos = cesiumCamera.positionWC;
    this.camera.position.set(pos.x, pos.y, pos.z);

    // Sync frustum
    const frustum = cesiumCamera.frustum;
    if (frustum && frustum.fov) {
      this.camera.fx = frustum.fov;
    }
  }

  render() {
    if (!this.isInitialized || !this.scene) return;
    this.renderer.render(this.scene, this.camera);
  }

  skipFrame() {
    // Do nothing - budget exceeded
  }

  getColorTexture() {
    return this.canvas;
  }

  dispose() {
    if (this.scene) {
      this.scene.reset();
    }
    this.isInitialized = false;
    this.currentSplat = null;
  }

  resize(width, height) {
    if (this.renderer) {
      this.renderer.setSize(width, height);
    }
  }
}
