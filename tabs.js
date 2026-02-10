class TabManager {
  constructor() {
    this.tabs = new Map();
    this.activeTab = 'tab1';
    this.tabCounter = 1;
    this.init();
  }

  init() {
    this.createTab();
    
    document.getElementById('new-tab').addEventListener('click', () => this.createTab());
    document.addEventListener('keydown', (e) => this.handleShortcuts(e));
    
    document.getElementById('tab-bar').addEventListener('click', (e) => {
      const tab = e.target.closest('.tab');
      if (tab && !e.target.classList.contains('tab-close')) {
        this.switchTab(tab.dataset.tab);
      }
    });
  }

  createTab() {
    const tabId = `tab${this.tabCounter++}`;
    this.tabs.set(tabId, { 
      title: 'New Tab', 
      url: 'https://duckduckgo.com',
      history: ['https://duckduckgo.com'],
      historyIndex: 0 
    });
    
    const tabBar = document.getElementById('tab-bar');
    const tabEl = document.createElement('div');
    tabEl.className = 'tab';
    tabEl.dataset.tab = tabId;
    tabEl.innerHTML = `
      <span class="tab-title">New Tab</span>
      <button class="tab-close" data-close="${tabId}">×</button>
    `;
    tabBar.appendChild(tabEl);

    const content = document.createElement('div');
    content.id = tabId;
    content.className = 'tab-content';
    content.innerHTML = `
      <div class="address-bar">
        <input type="text" class="url-input" id="url-input-${tabId}" placeholder="Enter URL..." value="https://duckduckgo.com">
        <button class="go-btn" data-tab="${tabId}">Go</button>
      </div>
      <div class="content" id="content-${tabId}">
        <iframe id="frame-${tabId}"></iframe>
      </div>
    `;
    document.getElementById('tab-contents').appendChild(content);

    // Bind Go button
    document.querySelector(`#url-input-${tabId}`).addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.navigate(tabId);
    });
    document.querySelector(`[data-tab="${tabId}"].go-btn`).addEventListener('click', () => this.navigate(tabId));

    this.switchTab(tabId);
  }

  switchTab(tabId) {
    this.activeTab = tabId;
    document.querySelectorAll('.tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.tab === tabId);
    });
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.toggle('active', content.id === tabId);
    });
  }

  async navigate(tabId) {
    const urlInput = document.getElementById(`url-input-${tabId}`);
    let url = urlInput.value.trim();
    
    if (!url.match(/^https?:\/\//)) {
      url = `https://duckduckgo.com/?q=${encodeURIComponent(url)}`;
    }
    
    const tab = this.tabs.get(tabId);
    tab.url = url;
    
    await window.loadProxiedFrame(tabId, url);
    urlInput.value = url;
  }

  closeTab(tabId) {
    if (this.tabs.size <= 1) return;
    document.querySelector(`[data-tab="${tabId}"]`).remove();
    document.getElementById(tabId).remove();
    this.tabs.delete(tabId);
    const tabArray = Array.from(this.tabs.keys());
    this.switchTab(tabArray[0]);
  }

  handleShortcuts(e) {
    if (e.ctrlKey || e.metaKey) {
      switch(e.key.toLowerCase()) {
        case 't': e.preventDefault(); this.createTab(); break;
        case 'w': e.preventDefault(); this.closeTab(this.activeTab); break;
        case 'l': 
          e.preventDefault();
          document.getElementById(`url-input-${this.activeTab}`)?.focus();
          break;
        case 'r': e.preventDefault(); window.refreshFrame?.(this.activeTab); break;
      }
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.tabManager = new TabManager();
});
