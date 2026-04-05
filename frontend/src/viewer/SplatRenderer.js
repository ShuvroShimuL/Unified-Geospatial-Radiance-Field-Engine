// PLACEHOLDER: Rotating cube demonstrates OffscreenCanvas compositing pipeline.
// Replace with gsplat.js integration in the splat-renderer ticket.

export class SplatRenderer {
  constructor(width, height) {
    this.width = width;
    this.height = height;

    this.canvas = new OffscreenCanvas(width, height);
    this.gl = this.canvas.getContext('webgl2');
    if (!this.gl) {
      throw new Error('WebGL2 not supported in OffscreenCanvas');
    }

    this.initShaders();
    this.initBuffers();
    this.initRenderTargets();

    this.rotation = 0;
  }

  resize(width, height) {
    if (this.width !== width || this.height !== height) {
      this.width = width;
      this.height = height;
      this.canvas.width = width;
      this.canvas.height = height;
      this.initRenderTargets();
    }
  }

  initShaders() {
    const vsSource = `#version 300 es
      precision highp float;
      in vec4 aVertexPosition;
      in vec4 aVertexColor;

      uniform mat4 uModelViewMatrix;
      uniform mat4 uProjectionMatrix;
      uniform vec3 uCameraOffset; // RTE residual

      out lowp vec4 vColor;

      void main() {
        vec4 pos = aVertexPosition + vec4(uCameraOffset, 0.0);
        gl_Position = uProjectionMatrix * uModelViewMatrix * pos;
        vColor = aVertexColor;
      }
    `;

    const fsSource = `#version 300 es
      precision highp float;
      in lowp vec4 vColor;
      layout(location = 0) out lowp vec4 fragColor;
      layout(location = 1) out float fragDepth; // Custom depth target

      void main() {
        fragColor = vColor;
        // Output a custom depth map value, hardcoded test depth for now
        fragDepth = gl_FragCoord.z;
      }
    `;

    const gl = this.gl;
    const vertexShader = this.loadShader(gl.VERTEX_SHADER, vsSource);
    const fragmentShader = this.loadShader(gl.FRAGMENT_SHADER, fsSource);

    this.shaderProgram = gl.createProgram();
    gl.attachShader(this.shaderProgram, vertexShader);
    gl.attachShader(this.shaderProgram, fragmentShader);
    gl.linkProgram(this.shaderProgram);

    if (!gl.getProgramParameter(this.shaderProgram, gl.LINK_STATUS)) {
      console.error('Unable to initialize the shader program: ' + gl.getProgramInfoLog(this.shaderProgram));
      return;
    }

    this.programInfo = {
      attribLocations: {
        vertexPosition: gl.getAttribLocation(this.shaderProgram, 'aVertexPosition'),
        vertexColor: gl.getAttribLocation(this.shaderProgram, 'aVertexColor'),
      },
      uniformLocations: {
        projectionMatrix: gl.getUniformLocation(this.shaderProgram, 'uProjectionMatrix'),
        modelViewMatrix: gl.getUniformLocation(this.shaderProgram, 'uModelViewMatrix'),
        cameraOffset: gl.getUniformLocation(this.shaderProgram, 'uCameraOffset'),
      },
    };
  }

  loadShader(type, source) {
    const gl = this.gl;
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  initBuffers() {
    const gl = this.gl;

    // Create a cube
    const positions = [
      // Front face
      -1.0, -1.0,  1.0,
       1.0, -1.0,  1.0,
       1.0,  1.0,  1.0,
      -1.0,  1.0,  1.0,

      // Back face
      -1.0, -1.0, -1.0,
      -1.0,  1.0, -1.0,
       1.0,  1.0, -1.0,
       1.0, -1.0, -1.0,

      // Top face
      -1.0,  1.0, -1.0,
      -1.0,  1.0,  1.0,
       1.0,  1.0,  1.0,
       1.0,  1.0, -1.0,

      // Bottom face
      -1.0, -1.0, -1.0,
       1.0, -1.0, -1.0,
       1.0, -1.0,  1.0,
      -1.0, -1.0,  1.0,

      // Right face
       1.0, -1.0, -1.0,
       1.0,  1.0, -1.0,
       1.0,  1.0,  1.0,
       1.0, -1.0,  1.0,

      // Left face
      -1.0, -1.0, -1.0,
      -1.0, -1.0,  1.0,
      -1.0,  1.0,  1.0,
      -1.0,  1.0, -1.0,
    ];

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    const faceColors = [
      [1.0,  1.0,  1.0,  1.0],    // Front face: white
      [1.0,  0.0,  0.0,  1.0],    // Back face: red
      [0.0,  1.0,  0.0,  1.0],    // Top face: green
      [0.0,  0.0,  1.0,  1.0],    // Bottom face: blue
      [1.0,  1.0,  0.0,  1.0],    // Right face: yellow
      [1.0,  0.0,  1.0,  1.0],    // Left face: purple
    ];

    let colors = [];
    for (let j = 0; j < faceColors.length; ++j) {
      const c = faceColors[j];
      colors = colors.concat(c, c, c, c);
    }

    const colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

    const indices = [
      0,  1,  2,      0,  2,  3,    // front
      4,  5,  6,      4,  6,  7,    // back
      8,  9,  10,     8,  10, 11,   // top
      12, 13, 14,     12, 14, 15,   // bottom
      16, 17, 18,     16, 18, 19,   // right
      20, 21, 22,     20, 22, 23,   // left
    ];

    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

    this.buffers = {
      position: positionBuffer,
      color: colorBuffer,
      indices: indexBuffer,
    };
  }

  initRenderTargets() {
    const gl = this.gl;

    if (this.framebuffer) {
      gl.deleteFramebuffer(this.framebuffer);
      gl.deleteTexture(this.colorTexture);
      gl.deleteTexture(this.depthTexture);
    }

    this.colorTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.colorTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.width, this.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    this.depthTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.depthTexture);
    // Use float texture for our custom depth values
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.R32F, this.width, this.height, 0, gl.RED, gl.FLOAT, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    // True WebGL depth buffer (for depth testing within the splat render itself)
    this.renderbuffer = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, this.renderbuffer);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, this.width, this.height);

    this.framebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.colorTexture, 0);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT1, gl.TEXTURE_2D, this.depthTexture, 0);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, this.renderbuffer);

    gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1]);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  // Generate a simple perspective matrix (will be replaced by real camera sync)
  perspective(fieldOfViewInRadians, aspectRatio, near, far) {
    const f = 1.0 / Math.tan(fieldOfViewInRadians / 2);
    const rangeInv = 1 / (near - far);

    return [
      f / aspectRatio, 0, 0, 0,
      0, f, 0, 0,
      0, 0, (near + far) * rangeInv, -1,
      0, 0, near * far * rangeInv * 2, 0
    ];
  }

  // Translation matrix
  translate(m, v) {
    const r = m.slice();
    r[12] = m[0] * v[0] + m[4] * v[1] + m[8] * v[2] + m[12];
    r[13] = m[1] * v[0] + m[5] * v[1] + m[9] * v[2] + m[13];
    r[14] = m[2] * v[0] + m[6] * v[1] + m[10] * v[2] + m[14];
    r[15] = m[3] * v[0] + m[7] * v[1] + m[11] * v[2] + m[15];
    return r;
  }

  // Rotate Z
  rotateZ(m, angle) {
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    const r = m.slice();
    r[0] = m[0] * c + m[4] * s;
    r[1] = m[1] * c + m[5] * s;
    r[2] = m[2] * c + m[6] * s;
    r[3] = m[3] * c + m[7] * s;
    r[4] = m[4] * c - m[0] * s;
    r[5] = m[5] * c - m[1] * s;
    r[6] = m[6] * c - m[2] * s;
    r[7] = m[7] * c - m[3] * s;
    return r;
  }

  // Rotate X
  rotateX(m, angle) {
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    const r = m.slice();
    r[4] = m[4] * c + m[8] * s;
    r[5] = m[5] * c + m[9] * s;
    r[6] = m[6] * c + m[10] * s;
    r[7] = m[7] * c + m[11] * s;
    r[8] = m[8] * c - m[4] * s;
    r[9] = m[9] * c - m[5] * s;
    r[10] = m[10] * c - m[6] * s;
    r[11] = m[11] * c - m[7] * s;
    return r;
  }

  syncFromCesium(camera) {
    // For Phase 4 we mock RTE sync by passing an offset.
    // In a real implementation with gsplat.js, we would update the view matrix and RTE offset.
    // We update projection matrix using Cesium camera frustum
    this.zNear = camera.frustum.near;
    this.zFar = camera.frustum.far;

    // We'll calculate a mock residual just to demonstrate the uniform binding
    // In reality CoordinateUtils.calculateRTEResidual would be used here against splat centroids.
    this.mockResidual = [0.0, 0.0, 0.0];
  }

  render() {
    const gl = this.gl;

    gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
    gl.viewport(0, 0, this.width, this.height);

    // Clear color to transparent black to allow compositing
    gl.clearColor(0.0, 0.0, 0.0, 0.0);
    gl.clearDepth(1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);

    const fieldOfView = 45 * Math.PI / 180;
    const aspect = this.width / this.height;
    // Fallback if syncFromCesium hasn't been called yet
    const zNear = this.zNear || 0.1;
    const zFar = this.zFar || 100.0;
    const projectionMatrix = this.perspective(fieldOfView, aspect, zNear, zFar);

    let modelViewMatrix = [
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1
    ];
    modelViewMatrix = this.translate(modelViewMatrix, [0.0, 0.0, -6.0]);
    modelViewMatrix = this.rotateZ(modelViewMatrix, this.rotation);
    modelViewMatrix = this.rotateX(modelViewMatrix, this.rotation * 0.7);

    // Vertex position
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.position);
    gl.vertexAttribPointer(this.programInfo.attribLocations.vertexPosition, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(this.programInfo.attribLocations.vertexPosition);

    // Color
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.color);
    gl.vertexAttribPointer(this.programInfo.attribLocations.vertexColor, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(this.programInfo.attribLocations.vertexColor);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.buffers.indices);

    gl.useProgram(this.shaderProgram);

    gl.uniformMatrix4fv(this.programInfo.uniformLocations.projectionMatrix, false, new Float32Array(projectionMatrix));
    gl.uniformMatrix4fv(this.programInfo.uniformLocations.modelViewMatrix, false, new Float32Array(modelViewMatrix));

    const res = this.mockResidual || [0.0, 0.0, 0.0];
    gl.uniform3f(this.programInfo.uniformLocations.cameraOffset, res[0], res[1], res[2]);

    gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0);

    // Unbind
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    this.rotation += 0.01;
  }
}
