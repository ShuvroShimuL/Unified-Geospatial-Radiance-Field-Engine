export class InfoPanel {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = containerId;
      document.body.appendChild(this.container);
    }

    this.applyStyles();
    this.showDefault();
  }

  showDefault() {
    this.container.style.display = 'flex';
    this.container.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #444; padding-bottom: 5px;">
        <h3 style="margin: 0; font-size: 16px;">Spatial Intelligence</h3>
        <button id="closeInfoPanel" style="background: none; border: none; color: #fff; cursor: pointer; font-size: 16px;">&times;</button>
      </div>
      <div style="padding: 10px 0;">
        Click anywhere on the map to query the Spatial RAG engine.
      </div>
    `;
    this.bindCloseButton();
  }

  applyStyles() {
    this.container.style.position = 'absolute';
    this.container.style.bottom = '30px';
    this.container.style.right = '30px';
    this.container.style.width = '350px';
    this.container.style.maxHeight = '400px';
    this.container.style.backgroundColor = 'rgba(15, 15, 20, 0.7)';
    this.container.style.backdropFilter = 'blur(12px)';
    this.container.style.WebkitBackdropFilter = 'blur(12px)';
    this.container.style.border = '1px solid rgba(255, 255, 255, 0.1)';
    this.container.style.color = '#fff';
    this.container.style.padding = '20px';
    this.container.style.borderRadius = '16px';
    this.container.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
    this.container.style.fontSize = '14px';
    this.container.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.4)';
    this.container.style.overflowY = 'auto';
    this.container.style.zIndex = '1000';
    this.container.style.pointerEvents = 'auto';
    this.container.style.display = 'flex';
    this.container.style.flexDirection = 'column';
    this.container.style.gap = '12px';
    this.container.style.transition = 'opacity 0.3s ease-in-out, transform 0.3s ease-in-out';
    this.container.style.opacity = '1';
    this.container.style.transform = 'translateY(0)';
  }

  showLoading() {
    this.container.style.display = 'flex';
    this.container.style.opacity = '1';
    this.container.style.transform = 'translateY(0)';
    this.container.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 10px;">
        <h3 style="margin: 0; font-size: 16px; font-weight: 600;">Spatial Intelligence</h3>
        <button id="closeInfoPanel" style="background: none; border: none; color: #fff; cursor: pointer; font-size: 20px; line-height: 1;">&times;</button>
      </div>
      <div style="display: flex; align-items: center; gap: 8px; padding: 15px 0;">
        <div class="typing-indicator">
          <span></span><span></span><span></span>
        </div>
        <span style="color: rgba(255,255,255,0.7); font-size: 13px;">Analyzing context...</span>
      </div>
      <style>
        .typing-indicator { display: flex; gap: 4px; }
        .typing-indicator span {
          width: 6px; height: 6px; background-color: #fff; border-radius: 50%;
          animation: type 1s infinite ease-in-out;
        }
        .typing-indicator span:nth-child(1) { animation-delay: 0s; }
        .typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
        .typing-indicator span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes type {
          0%, 100% { transform: translateY(0); opacity: 0.3; }
          50% { transform: translateY(-4px); opacity: 1; }
        }
      </style>
    `;
    this.bindCloseButton();
  }

  showResult(lat, lon, query, resultText, cached) {
    this.container.style.display = 'flex';
    this.container.style.opacity = '1';
    this.container.style.transform = 'translateY(0)';
    this.container.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 10px;">
        <h3 style="margin: 0; font-size: 16px; font-weight: 600;">Spatial Intelligence</h3>
        <button id="closeInfoPanel" style="background: none; border: none; color: #fff; cursor: pointer; font-size: 20px; line-height: 1;">&times;</button>
      </div>
      <div style="display: flex; align-items: center; gap: 6px; font-size: 12px; color: rgba(255,255,255,0.6); margin-bottom: 4px;">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
          <circle cx="12" cy="10" r="3"></circle>
        </svg>
        ${lat.toFixed(5)}, ${lon.toFixed(5)}
      </div>
      <div style="font-size: 13px; font-style: italic; color: rgba(255,255,255,0.8); margin-bottom: 8px;">
        "${query}"
      </div>
      <div style="line-height: 1.6; font-size: 14px;">
        ${resultText}
      </div>
      <div style="font-size: 11px; color: rgba(255,255,255,0.4); text-align: right; margin-top: auto; padding-top: 10px;">
        ${cached ? 'Cached Response' : 'Generated Response'}
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
    this.container.style.opacity = '0';
    this.container.style.transform = 'translateY(10px)';
    setTimeout(() => {
      this.container.style.display = 'none';
    }, 300);
  }

  bindCloseButton() {
    const btn = document.getElementById('closeInfoPanel');
    if (btn) {
      btn.addEventListener('click', () => this.hide());
    }
  }
}
