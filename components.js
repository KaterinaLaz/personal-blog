// helpers
function persistTheme(theme) { localStorage.setItem('theme', theme); }
function loadTheme() { return localStorage.getItem('theme'); }
function setTheme(theme) { document.documentElement.setAttribute('data-theme', theme); persistTheme(theme); }
(function initTheme(){
  const saved = loadTheme();
  if (saved) setTheme(saved);
  else if (window.matchMedia('(prefers-color-scheme: dark)').matches) setTheme('dark');
})();

// <site-header>
customElements.define('site-header', class extends HTMLElement {
  connectedCallback () {
    const brand = this.getAttribute('brand') ?? '✦';
    const children = Array.from(this.childNodes); 

    this.innerHTML = `
      <header class="site-header">
        <nav class="nav container">
          <a class="brand" href="/">✦ Katerina</a>
          <div class="actions">
            <div class="links">
              <!-- your <a> links go here -->
            </div>
            <label class="theme-switch">
              <input type="checkbox" id="theme-toggle" />
              <span class="track"></span>
              <span class="knob"></span>
            </label>
            <button class="menu-btn" aria-label="Open menu">☰</button>
          </div>
        </nav>
      </header>

      <div id="menu-panel" class="menu-panel" hidden>
        <div class="menu-card">
          <button class="menu-close" aria-label="Close menu">✕</button>
          <nav class="menu-links" aria-label="Mobile"></nav>
        </div>
      </div>
    `;

    // move your <a> into desktop .links
    const linksEl = this.querySelector('.links');
    children.forEach(n => linksEl.appendChild(n));

    // clone links into mobile menu
    const mobLinks = this.querySelector('.menu-links');
    linksEl.querySelectorAll('a').forEach(a => mobLinks.appendChild(a.cloneNode(true)));

    // ---- Theme switcher (pure SVG) ----
    const input = this.querySelector('#theme-toggle');
    const knob  = this.querySelector('.knob');
    

    const sunSVG = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="4"/>
        <path d="M12 2v2M12 20v2M4 12H2M22 12h-2M5 5l-1.5-1.5M20.5 20.5L19 19M5 19l-1.5 1.5M20.5 3.5L19 5"/>
      </svg>`;
    const moonSVG = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
      </svg>`;

    const getTheme = () =>
      localStorage.getItem('theme') || document.documentElement.getAttribute('data-theme') || 'light';

    const applyTheme = (t) => {
      document.documentElement.setAttribute('data-theme', t);
      localStorage.setItem('theme', t);
      input.checked = (t === 'dark');
      knob.innerHTML = t === 'dark' ? moonSVG : sunSVG;
    };

    applyTheme(getTheme());
    input.addEventListener('change', () => applyTheme(input.checked ? 'dark' : 'light'));

    // ---- Mobile menu open/close ----
    const btn   = this.querySelector('.menu-btn');
    const panel = this.querySelector('#menu-panel');
    const close = this.querySelector('.menu-close');

    const openMenu  = () => { panel.hidden = false; btn.setAttribute('aria-expanded','true'); document.body.style.overflow = 'hidden'; };
    const closeMenu = () => { panel.hidden = true;  btn.setAttribute('aria-expanded','false'); document.body.style.overflow = ''; };

    btn.addEventListener('click', openMenu);
    close.addEventListener('click', closeMenu);
    panel.addEventListener('click', e => { if (e.target === panel) closeMenu(); });
    mobLinks.addEventListener('click', e => { if (e.target.closest('a')) closeMenu(); });
    window.addEventListener('keydown', e => { if (e.key === 'Escape' && !panel.hidden) closeMenu(); });
  }
});


// <hero-block>
customElements.define('hero-block', class extends HTMLElement{
  connectedCallback(){
    const title = this.getAttribute('title') ?? '';
    const intro = this.getAttribute('intro') ?? '';
    this.innerHTML = `
      <section class="hero container">
        <h1>${title}</h1>
        <p>${intro}</p>
        <slot name="bullets"></slot>
        <p><slot name="cta"></slot></p>
      </section>
    `;
  }
});

// ------ small helpers ------
const html = (strings, ...vals) =>
  strings.reduce((s, str, i) => s + str + (vals[i] ?? ''), '');


// ------ Blog components (same look as project cards) ------
// ------ Blog components (grid + cards) ------
customElements.define('blog-card', class extends HTMLElement{
  static get observedAttributes(){ return ['href','title','desc','image','date']; }
  connectedCallback(){ this.render(); }
  attributeChangedCallback(){ this.render(); }

  render(){
    const href  = this.getAttribute('href')  ?? '#';
    const title = this.getAttribute('title') ?? '';
    const desc  = this.getAttribute('desc')  ?? '';
    const image = this.getAttribute('image') ?? '';
    const date  = this.getAttribute('date')  ?? '';

    const a = document.createElement('a');
    a.className = 'card project-card'; 
    a.href = href; a.target = '_self'; a.rel = 'noopener';

    const thumb = document.createElement('div');
    thumb.className = 'thumb';
    if (image){
      const img = document.createElement('img');
      img.src = image;
      img.alt = title || 'Post image';
      thumb.appendChild(img);
    } else {
      const ph = document.createElement('div');
      ph.className = 'thumb-ph';
      ph.textContent = 'No image';
      thumb.appendChild(ph);
    }

    const meta = document.createElement('div');
    meta.className = 'meta';
    const h3 = document.createElement('h3'); h3.textContent = title;
    const p  = document.createElement('p');  p.textContent  = desc;

    if (date){
      const small = document.createElement('p');
      small.className = 'muted small';
      small.textContent = new Date(date).toLocaleDateString(undefined, {
        year:'numeric', month:'short', day:'2-digit'
      });
      meta.appendChild(small);
    }

    meta.prepend(h3);
    meta.appendChild(p);

    a.append(thumb, meta);
    this.replaceChildren(a);
  }
});

// ====  <blogs-grid> ====
// Handles both posts (src includes "post") and projects (src includes "project").
// Links:
//   posts    -> post/?p=<slug>
//   projects -> projects/?p=<slug>

customElements.define('blogs-grid', class extends HTMLElement{
  static get observedAttributes(){ return ['src','heading','subheading','show','all-href']; }
  _loadedFor = null; _loading = false; _data = [];

  connectedCallback(){
    this.render();
    if (this.getAttribute('src')) this.load();
  }

  attributeChangedCallback(n){
    if (n==='src') this.load();
    if (n==='heading' || n==='subheading' || n==='all-href' || n==='show') this.render();
  }

  render(){
    const heading = this.getAttribute('heading') ?? 'Latest';
    const sub     = this.getAttribute('subheading') ?? '';
    const allHref = this.getAttribute('all-href') ?? '';
    const moreBtn = allHref ? `<a class="view-more-btn" href="${allHref}">View all →</a>` : '';

    this.innerHTML = `
      <section class="stack container">
        <h2>${heading}</h2>
        ${sub ? `<p class="muted">${sub}</p>` : ''}
        <div class="grid" part="grid"><p class="muted">Loading…</p></div>
        ${moreBtn ? `<p>${moreBtn}</p>` : '<p><slot name="more"></slot></p>'}
      </section>
    `;
  }

  async load(){
    const src = this.getAttribute('src');
    if (!src || this._loading || this._loadedFor === src) return;
    this._loading = true; this._loadedFor = src;

    const grid = this.querySelector('[part="grid"]') || this.querySelector('.grid');

    try {
      const url = new URL(src, this.baseURI).href;
      const res = await fetch(url, { headers: { 'Accept': 'application/json' }});
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);

      const items = await res.json();
      if (!Array.isArray(items)) throw new Error('JSON must be an array');
      this._data = items;
      this.populate();
    } catch (err){
      console.error('blogs-grid load error:', err);
      if (grid) grid.innerHTML = `<p class="muted">Could not load data.</p>`;
    } finally {
      this._loading = false;
    }
  }

  populate(){
    const grid = this.querySelector('[part="grid"]') || this.querySelector('.grid');
    if (!grid) return;
    if (!this._data.length){ grid.innerHTML = `<p class="muted">Nothing to show yet.</p>`; return; }

    const showCount = parseInt(this.getAttribute('show') || '0', 10);
    const items = showCount > 0 ? this._data.slice(0, showCount) : this._data;

    // Decide whether we're rendering posts or projects
    const src = (this.getAttribute('src') || '').toLowerCase();
    let kind = src.includes('project') ? 'project' : (src.includes('post') ? 'post' : 'auto');
    if (kind === 'auto') {
      const f = items[0] || {};
      kind = ('date' in f || 'body' in f || 'slug' in f) ? 'post' : 'project';
    }

    const slugify = (s='') => s.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');
    const toPostUrl    = (it) => `post/?p=${it.slug ?? slugify(it.title || '')}`;
    const toProjectUrl = (it) => `projects/?p=${it.slug ?? slugify(it.title || '')}`;

    // Render using your existing <blog-card> (re-using its card visuals)
    grid.innerHTML = '';
    items.forEach(item => {
      const card = document.createElement('blog-card');
      const href = (kind === 'post') ? toPostUrl(item) : toProjectUrl(item);

      card.setAttribute('href', href);
      if (item.title) card.setAttribute('title', item.title);
      if (item.desc)  card.setAttribute('desc', item.desc);
      if (item.image) card.setAttribute('image', item.image);
      if (kind === 'post' && item.date) card.setAttribute('date', item.date);

      card.dataset.auto = 'true';
      grid.appendChild(card);
    });

    // Auto “View all” button only if you didn’t provide all-href and there are more items
    const providedAllHref = this.getAttribute('all-href');
    if (!providedAllHref && this._data.length > items.length) {
      const a = document.createElement('a');
      a.slot = 'more';
      a.className = 'view-more-btn';
      a.href = kind === 'post' ? 'post/' : 'projects/';
      a.textContent = 'View all →';
      this.appendChild(a);
    }
  }
});


// <site-footer>
customElements.define('site-footer', class extends HTMLElement{
  connectedCallback(){
    const year  = this.getAttribute('year')  ?? new Date().getFullYear();
    const brand = this.getAttribute('brand') ?? '✦ Katerina';
    const name  = this.getAttribute('name')  ?? 'Katerina Lazari';

    // capture any children (e.g., <a data-icon="github">) BEFORE we overwrite innerHTML
    const provided = Array.from(this.childNodes).filter(n => n.nodeType === 1); // element nodes

    this.innerHTML = `
      <footer class="site-footer">
        <div class="container footer-row">
          <div class="footer-left">
            <a class="footer-brand" href="/">${brand}</a>
            <span class="divider" aria-hidden="true"></span>
            <span class="copyright">© ${year} ${name}</span>
          </div>
          <nav class="social" aria-label="Social links">
            <!-- we will move your <a> here -->
          </nav>
        </div>
      </footer>
    `;

    // move user-provided links into the .social container (out of the slot)
    const social = this.querySelector('.social');
    provided.forEach(el => social.appendChild(el));

    // icons map (use your SVG file)
    const ICONS = {
      github: `<img src="/images/github-mark-white.svg" alt="GitHub" width="18" height="18" />`,
      // add others if you want:
      // instagram: `<svg ...></svg>`,
      // x: `<svg ...></svg>`
    };

    // decorate ALL links in .social (data-icon explicit or infer by hostname)
    social.querySelectorAll('a').forEach(a => {
      let key = (a.getAttribute('data-icon') || '').toLowerCase();

      if (!key) {
        try {
          const host = new URL(a.getAttribute('href') || '', location.href).hostname.toLowerCase();
          if (host.includes('github')) key = 'github';
          // else if (host.includes('instagram')) key = 'instagram';
          // else if (host.includes('x.com') || host.includes('twitter')) key = 'x';
        } catch {}
      }

      const icon = ICONS[key];
      if (!icon) return;

      a.classList.add('icon-btn');
      if (!a.getAttribute('aria-label')) a.setAttribute('aria-label', key);
      a.innerHTML = icon;

      if (/^https?:\/\//i.test(a.getAttribute('href')||'')) {
        a.target = '_blank';
        a.rel = 'noopener';
      }
    });
  }
});

