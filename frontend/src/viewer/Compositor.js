import * as Cesium from 'cesium';
import { SplatRenderer } from './SplatRenderer.js';
import { LodManager } from './LodManager.js';

// PLACEHOLDER: Rotating cube demonstrates OffscreenCanvas compositing pipeline.
// Replace with gsplat.js integration in the splat-renderer ticket.

export class Compositor {
  constructor(viewer) {
    this.viewer = viewer;

    // Initialize the offscreen renderer at current resolution
    const canvas = viewer.canvas;
    this.splatRenderer = new SplatRenderer(canvas.width, canvas.height);
    this.lodManager = new LodManager(viewer, this.splatRenderer);

    this.initPostProcessStage();
    this.bindEvents();
  }

  initPostProcessStage() {
    const compositeFragShader = `
      uniform sampler2D colorTexture;     // Cesium scene color
      uniform sampler2D depthTexture;     // Cesium scene depth (logarithmic)
      uniform sampler2D splatColorTexture;// Our offscreen splat color
      uniform sampler2D splatDepthTexture;// Our offscreen splat depth
      uniform float cameraNear;
      uniform float cameraFar;

      in vec2 v_textureCoordinates;
      out vec4 fragColor;

      float logDepthToLinear(float logDepth, float near, float far) {
        float Fcoef = 2.0 / log2(far + 1.0);
        float w = pow(2.0, logDepth / Fcoef) - 1.0;
        return (2.0 * near * far) / (far + near - w * (far - near));
      }

      void main() {
        vec4 cesiumColor = texture(colorTexture, v_textureCoordinates);
        vec4 splatColor = texture(splatColorTexture, v_textureCoordinates);

        float cesiumLogDepth = texture(depthTexture, v_textureCoordinates).r;
        float splatDepth = texture(splatDepthTexture, v_textureCoordinates).r;

        // Convert Cesium log depth to linear depth
        float cesiumLinearDepth = logDepthToLinear(cesiumLogDepth, cameraNear, cameraFar);

        // Here we would compare cesiumLinearDepth to splatDepth to see which is closer.
        // For the rotating cube placeholder, we'll continue to do a simple alpha blend so it's visible.

        fragColor = vec4(mix(cesiumColor.rgb, splatColor.rgb, splatColor.a), 1.0);
      }
    `;

    this.compositeStage = new Cesium.PostProcessStage({
      fragmentShader: compositeFragShader,
      uniforms: {
        splatColorTexture: () => {
          // Provide the WebGLTexture from our offscreen context
          // Cesium requires this to be a Cesium Texture object.
          // We must wrap it.
          if (!this.cesiumSplatColorTexture) {
            this.cesiumSplatColorTexture = new Cesium.Texture({
              context: this.viewer.scene.context,
              source: this.splatRenderer.canvas,
              width: this.splatRenderer.width,
              height: this.splatRenderer.height,
              pixelFormat: Cesium.PixelFormat.RGBA,
              pixelDatatype: Cesium.PixelDatatype.UNSIGNED_BYTE,
            });
          }
          // Copy data from offscreen canvas to Cesium texture
          this.cesiumSplatColorTexture.copyFrom({
            source: this.splatRenderer.canvas,
          });
          return this.cesiumSplatColorTexture;
        },
        splatDepthTexture: () => {
          // Mock depth texture for placeholder
          if (!this.mockDepth) {
            this.mockDepth = this.viewer.scene.context.defaultTexture;
          }
          return this.mockDepth;
        },
        cameraNear: () => this.viewer.camera.frustum.near,
        cameraFar: () => this.viewer.camera.frustum.far,
      }
    });

    this.viewer.scene.postProcessStages.add(this.compositeStage);
  }

  bindEvents() {
    // Handle resizing
    window.addEventListener('resize', () => {
      const canvas = this.viewer.canvas;
      this.splatRenderer.resize(canvas.width, canvas.height);

      // Destroy old texture to recreate on next frame
      if (this.cesiumSplatColorTexture) {
        this.cesiumSplatColorTexture.destroy();
        this.cesiumSplatColorTexture = null;
      }
    });

    // Render loop sync
    const FRAME_BUDGET_MS = 33;
    let lastFrameTime = 0;

    this.viewer.scene.postRender.addEventListener(() => {
      const dt = performance.now() - lastFrameTime;
      lastFrameTime = performance.now();

      if (dt > FRAME_BUDGET_MS * 1.5) {
        // frameBudgetExceeded - skip splat render
        return;
      }

      // Phase 4: Mocking the rebasing check
      // CoordinateUtils.checkAndRebaseOrigin(this.viewer.camera.positionWC);

      // Phase 5: Update LODs
      // this.lodManager.updateLODs(this.viewer.camera.positionWC, [mockSplat]);

      this.splatRenderer.syncFromCesium(this.viewer.camera);
      this.splatRenderer.render();

      // The PostProcessStage uniforms function will copy the canvas to the texture.
    });
  }
}
