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
        const proxied = await this.fetchProxy(proxy, url);
        const rewritten = this.wasmStyleRewrite(proxied, url);
        return rewritten;
      } catch (e) {
        console.log(`Proxy ${proxy} failed`);
      }
    }
    throw new Error('All proxies failed');
  }

  static async fetchProxy(proxy, url) {
    const proxyUrl = `${proxy}${encodeURIComponent(url)}`;
    const res = await fetch(proxyUrl, { cache: 'no-store' });
    
    if (proxy.includes('allorigins')) {
      const data = await res.json();
      return data.contents;
    }
    return await res.text();
  }

  // TRUE WASM-style rewriting (Scramjet technique)
  static wasmStyleRewrite(html, baseURL) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // Rewrite ALL assets (Scramjet core technique)
    this.rewriteNode(doc.body, baseURL);
    this.rewriteHead(doc.head, baseURL);
    
    // Remove CSP completely
    const csp = doc.querySelector('meta[http-equiv="Content-Security-Policy"]');
    if (csp) csp.remove();
    
    // Fix viewport
    let viewport = doc.querySelector('meta[name="viewport"]');
    if (!viewport) {
      viewport = doc.createElement('meta');
      viewport.name = 'viewport';
      viewport.content = 'width=device-width, initial-scale=1';
      doc.head.appendChild(viewport);
    }
    
    return doc.documentElement.outerHTML;
  }

  static rewriteNode(node, baseURL) {
    // Links, images, scripts, CSS, iframes - ALL proxied
    const selectors = ['a[href]', 'img[src]', 'script[src]', 'link[href]', 
                      'iframe[src]', 'embed[src]', 'source[src]', 'track[srcset]'];
    
    selectors.forEach(sel => {
      node.querySelectorAll(sel).forEach(el => {
        const attr = sel.match(/\[(\w+)\]/)?.[1];
        if (attr) {
          const oldVal = el.getAttribute(attr);
          if (oldVal && !oldVal.startsWith('data:') && !oldVal.startsWith('#')) {
            const newVal = this.buildProxyURL(oldVal, baseURL);
            el.setAttribute(attr, newVal);
          }
        }
      });
    });
    
    // CSS url() rewriting
    node.querySelectorAll('style').forEach(style => {
      let css = style.textContent;
      css = css.replace(/url\([^)]+\)/g, match => {
        const url = match.slice(4, -1).trim().replace(/^["']|["']$/g, '');
        if (url.startsWith('http')) {
          return `url(${this.buildProxyURL(url, baseURL)})`;
        }
        return match;
      });
      style.textContent = css;
    });
  }

  static rewriteHead(head, baseURL) {
    // Fix base tag
    let base = head.querySelector('base');
    if (!base) {
      base = document.createElement('base');
      head.appendChild(base);
    }
    base.href = baseURL;
  }

  static buildProxyURL(targetURL, baseURL) {
    // Prefix with proxy + encode target
    const proxy = this.proxies[0];
    const encoded = encodeURIComponent(targetURL);
    return `${proxy}${encoded}`;
  }
}

// Global proxy for iframe src
window.loadProxied = async (url) => {
  try {
    const html = await AdvancedProxy.proxyURL(url);
    const blob = new Blob([html], { type: 'text/html' });
    const blobURL = URL.createObjectURL(blob);
    document.getElementById('frame').src = blobURL;
  } catch (e) {
    document.getElementById('frame').srcdoc = `
      <div style="padding:40px;text-align:center;background:#200;color:#fcc;">
        <h2>Proxy Blocked</h2>
        <p><a href="${url}" target="_blank">Open Externally</a></p>
      </div>
    `;
  }
};
