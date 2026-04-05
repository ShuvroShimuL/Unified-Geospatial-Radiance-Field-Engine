import * as Cesium from 'cesium';

/**
 * Transforms standard camera/globe coordinates to Relative-to-Eye (RTE) residuals for rendering.
 */
export class CoordinateUtils {
  constructor() {
    this.originECEF = new Cesium.Cartesian3(0, 0, 0);
  }

  /**
   * Sets the current local origin in ECEF.
   * Triggers a rebase when the residual is > 500m.
   * @param {Cesium.Cartesian3} cameraECEF
   */
  checkAndRebaseOrigin(cameraECEF) {
    const distance = Cesium.Cartesian3.distance(cameraECEF, this.originECEF);
    if (distance > 500.0) {
      // Rebase
      Cesium.Cartesian3.clone(cameraECEF, this.originECEF);
      return true;
    }
    return false;
  }

  /**
   * Calculate the RTE residual.
   * @param {Cesium.Cartesian3} cameraECEF
   * @param {number[]} centroidECEF Array of 3 floats
   * @returns {Cesium.Cartesian3} The residual
   */
  calculateRTEResidual(cameraECEF, centroidECEF) {
    // CPU side — float64 arithmetic
    return new Cesium.Cartesian3(
      cameraECEF.x - centroidECEF[0],
      cameraECEF.y - centroidECEF[1],
      cameraECEF.z - centroidECEF[2]
    );
  }

  /**
   * Generates ENU to ECEF matrix at given cartographic position.
   * @param {number} lat Radians
   * @param {number} lon Radians
   * @returns {Cesium.Matrix4}
   */
  getENUToECEFMatrix(lat, lon) {
    const position = Cesium.Cartesian3.fromRadians(lon, lat, 0);
    const transform = Cesium.Transforms.eastNorthUpToFixedFrame(position);
    return transform;
  }
}
