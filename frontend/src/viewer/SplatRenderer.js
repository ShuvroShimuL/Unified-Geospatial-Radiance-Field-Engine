import * as SPLAT from 'gsplat';

export class SplatRenderer {
  constructor() {
    this.renderer = null;
    this.scene = null;
    this.camera = null;
    this.controls = null;
    this.canvas = null;
    this.isInitialized = false;
    this.currentSplat = null;
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

  async loadSplat(url, onProgress) {
    console.log(`Loading splat from: ${url}`);
    try {
      // Create a specific format parameter if it's .splat
      const format = url.endsWith('.splat') ? SPLAT.SplatFormat : undefined;
      await SPLAT.Loader.LoadAsync(url, this.scene, (progress) => {
        console.log(`Splat loading: ${(progress * 100).toFixed(1)}%`);
        if (onProgress) onProgress(progress * 100);
      }, format);
      console.log('Splat loaded successfully');
      this.currentSplat = url;
    } catch (error) {
      console.error('Failed to load splat:', error);
      throw error;
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
