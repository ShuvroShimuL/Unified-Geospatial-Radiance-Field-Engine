export class InfoPanel {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = containerId;
      document.body.appendChild(this.container);
    }

    this.applyStyles();
    this.hide();
  }

  applyStyles() {
    this.container.style.position = 'absolute';
    this.container.style.bottom = '20px';
    this.container.style.right = '20px';
    this.container.style.width = '350px';
    this.container.style.maxHeight = '400px';
    this.container.style.backgroundColor = 'rgba(20, 20, 20, 0.9)';
    this.container.style.color = '#fff';
    this.container.style.padding = '15px';
    this.container.style.borderRadius = '8px';
    this.container.style.fontFamily = 'sans-serif';
    this.container.style.fontSize = '14px';
    this.container.style.boxShadow = '0 4px 6px rgba(0,0,0,0.3)';
    this.container.style.overflowY = 'auto';
    this.container.style.zIndex = '1000';
    this.container.style.pointerEvents = 'auto';
    this.container.style.display = 'flex';
    this.container.style.flexDirection = 'column';
    this.container.style.gap = '10px';
  }

  showLoading() {
    this.container.style.display = 'flex';
    this.container.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #444; padding-bottom: 5px;">
        <h3 style="margin: 0; font-size: 16px;">Spatial Intelligence</h3>
        <button id="closeInfoPanel" style="background: none; border: none; color: #fff; cursor: pointer; font-size: 16px;">&times;</button>
      </div>
      <div style="display: flex; align-items: center; justify-content: center; height: 100px;">
        <span style="animation: pulse 1.5s infinite;">Analyzing location...</span>
      </div>
      <style>
        @keyframes pulse {
          0% { opacity: 0.5; }
          50% { opacity: 1; }
          100% { opacity: 0.5; }
        }
      </style>
    `;
    this.bindCloseButton();
  }

  showResult(lat, lon, query, resultText, cached) {
    this.container.style.display = 'flex';
    this.container.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #444; padding-bottom: 5px;">
        <h3 style="margin: 0; font-size: 16px;">Spatial Intelligence</h3>
        <button id="closeInfoPanel" style="background: none; border: none; color: #fff; cursor: pointer; font-size: 16px;">&times;</button>
      </div>
      <div style="font-size: 12px; color: #aaa;">
        Location: ${lat.toFixed(5)}, ${lon.toFixed(5)} <br/>
        Query: <i>"${query}"</i>
      </div>
      <div style="line-height: 1.5;">
        ${resultText}
      </div>
      <div style="font-size: 10px; color: #777; text-align: right; margin-top: auto;">
        ${cached ? '(Cached)' : '(Generated)'}
      </div>
    `;
    this.bindCloseButton();
  }

  showError(errorMsg) {
    this.container.style.display = 'flex';
    this.container.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #444; padding-bottom: 5px;">
        <h3 style="margin: 0; font-size: 16px; color: #ff6b6b;">Error</h3>
        <button id="closeInfoPanel" style="background: none; border: none; color: #fff; cursor: pointer; font-size: 16px;">&times;</button>
      </div>
      <div style="color: #ff6b6b; padding: 10px 0;">
        ${errorMsg}
      </div>
    `;
    this.bindCloseButton();
  }

  hide() {
    this.container.style.display = 'none';
  }

  bindCloseButton() {
    const btn = document.getElementById('closeInfoPanel');
    if (btn) {
      btn.addEventListener('click', () => this.hide());
    }
  }
}
