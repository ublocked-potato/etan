class ScramjetUI {
  constructor() {
    this.tabs = new Map();
    this.activeTab = null;
    this.init();
  }

  async init() {
    this.createTab('https://duckduckgo.com');
    
    // UI bindings
    document.getElementById('newtab').onclick = () => this.createTab();
    document.getElementById('go').onclick = () => this.navigate();
    document.getElementById('urlbar').addEventListener('keypress', e => {
      if (e.key === 'Enter') this.navigate();
    });
    
    document.getElementById('back').onclick = () => this.goBack();
    document.getElementById('forward').onclick = () => this.goForward();
    document.getElementById('refresh').onclick = () => this.refresh();
    
    document.addEventListener('keydown', e => this.shortcuts(e));
    
    document.getElementById('tabs').addEventListener('click', e => {
      const tab = e.target.closest('.tab');
      if (tab && !e.target.classList.contains('tab-close')) {
        this.switchTab(tab.dataset.tab);
      }
    });
  }

  createTab(url = 'https://duckduckgo.com') {
    const tabId = `tab${Date.now()}`;
    this.tabs.set(tabId, { url, title: 'Loading...', history: [url], index: 0 });
    
    const tabEl = document.createElement('div');
    tabEl.className = 'tab active';
    tabEl.dataset.tab = tabId;
    tabEl.innerHTML = `
      <span class="title">Loading...</span>
      <button class="tab-close" data-close="${tabId}">×</button>
    `;
    document.getElementById('tabs').appendChild(tabEl);
    
    this.switchTab(tabId);
    this.loadURL(tabId, url);
  }

  async switchTab(tabId) {
    this.activeTab = tabId;
    document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tabId));
    const tab = this.tabs.get(tabId);
    document.getElementById('urlbar').value = tab.url;
    await this.loadURL(tabId, tab.url);
  }

  async loadURL(tabId, url) {
    const tab = this.tabs.get(tabId);
    tab.url = url;
    
    // Update title from iframe
    const frame = document.getElementById('frame');
    frame.onload = () => {
      const title = frame.contentDocument?.title || 'Untitled';
      tab.title = title.slice(0, 25);
      document.querySelector(`[data-tab="${tabId}"] .title`).textContent = tab.title;
    };
    
    window.loadProxied(url);
  }

  async navigate() {
    const url = document.getElementById('urlbar').value.trim();
    if (url) await this.loadURL(this.activeTab, this.fixURL(url));
  }

  fixURL(url) {
    if (!url.match(/^https?:\/\//)) url = 'https://' + url;
    try { new URL(url); return url; } 
    catch { return `https://duckduckgo.com/?q=${encodeURIComponent(url)}`; }
  }

  goBack() {
    const tab = this.tabs.get(this.activeTab);
    if (tab.index > 0) {
      tab.index--;
      this.loadURL(this.activeTab, tab.history[tab.index]);
    }
  }

  goForward() {
    const tab = this.tabs.get(this.activeTab);
    if (tab.index < tab.history.length - 1) {
      tab.index++;
      this.loadURL(this.activeTab, tab.history[tab.index]);
    }
  }

  refresh() {
    this.loadURL(this.activeTab, this.tabs.get(this.activeTab).url);
  }

  closeTab(tabId) {
    if (this.tabs.size <= 1) return;
    document.querySelector(`[data-tab="${tabId}"]`).remove();
    this.tabs.delete(tabId);
    const tabs = Array.from(this.tabs.keys());
    this.switchTab(tabs[0]);
  }

  shortcuts(e) {
    if (e.ctrlKey || e.metaKey) {
      switch(e.key.toLowerCase()) {
        case 't': e.preventDefault(); this.createTab(); break;
        case 'w': e.preventDefault(); this.closeTab(this.activeTab); break;
        case 'r': e.preventDefault(); this.refresh(); break;
        case 'l': e.preventDefault(); document.getElementById('urlbar').focus(); break;
      }
    }
  }
}
