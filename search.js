// Scramjet-level proxy for frames
window.loadProxiedFrame = async (tabId, url) => {
  const frame = document.getElementById(`frame-${tabId}`);
  const content = document.getElementById(`content-${tabId}`);
  
  content.innerHTML = '<div style="padding:60px;text-align:center;color:#666;">Loading...</div>';
  
  try {
    const html = await AdvancedProxy.proxyURL(url);
    const blob = new Blob([html], { type: 'text/html' });
    const blobURL = URL.createObjectURL(blob);
    frame.src = blobURL;
    
    frame.onload = () => {
      const title = frame.contentDocument?.title || 'Loaded';
      const tabEl = document.querySelector(`[data-tab="${tabId}"] .tab-title`);
      tabEl.textContent = title.slice(0, 25);
    };
  } catch (e) {
    content.innerHTML = `
      <div style="padding:60px;text-align:center;color:#fcc;background:rgba(200,0,0,0.1);border-radius:12px;margin:20px;">
        <h3>Proxy Blocked</h3>
        <p><a href="${url}" target="_blank" style="color:#00d4aa;">Open Externally</a></p>
      </div>
    `;
  }
};

// Scramjet-level proxy (same as before)
class AdvancedProxy {
  static proxies = [
    'https://api.allorigins.win/get?url=',
    'https://corsproxy.io/?',
    'https://thingproxy.freeboard.io/fetch/',
    'https://api.codetabs.com/v1/proxy'
  ];

  static async proxyURL(url) {
    for (const proxy of this.proxies) {
      try {
        const html = await this.fetchProxy(proxy, url);
        return this.wasmStyleRewrite(html, url);
      } catch (e) {}
    }
    throw new Error('All proxies failed');
  }

  static async fetchProxy(proxy, url) {
    const proxyUrl = `${proxy}${encodeURIComponent(url)}`;
    const res = await fetch(proxyUrl);
    return proxy.includes('allorigins') ? (await res.json()).contents : await res.text();
  }

  static wasmStyleRewrite(html, baseURL) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    this.rewriteAllAssets(doc.body, baseURL);
    this.removeCSP(doc.head);
    
    return doc.documentElement.outerHTML;
  }

  static rewriteAllAssets(node, baseURL) {
    ['a[href]', 'img[src]', 'script[src]', 'link[href]', 'iframe[src]'].forEach(sel => {
      node.querySelectorAll(sel).forEach(el => {
        const attr = sel.match(/\[(\w+)\]/)[1];
        const val = el.getAttribute(attr);
        if (val && !val.startsWith('data:') && !val.startsWith('#')) {
          el.setAttribute(attr, this.proxies[0] + encodeURIComponent(val));
        }
      });
    });
  }

  static removeCSP(head) {
    head.querySelectorAll('meta[http-equiv="Content-Security-Policy"]').forEach(m => m.remove());
  }
}

// Keyboard refresh
window.refreshFrame = (tabId) => {
  const frame = document.getElementById(`frame-${tabId}`);
  frame.src = frame.src;
};
