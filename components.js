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


// ------ Projects components ------
customElements.define('project-card', class extends HTMLElement{
  static get observedAttributes(){ return ['href','title','desc','image']; }

  connectedCallback(){ this.render(); }
  attributeChangedCallback(){ this.render(); }

  render(){
    const href  = this.getAttribute('href')  ?? '#';
    const title = this.getAttribute('title') ?? '';
    const desc  = this.getAttribute('desc')  ?? '';
    const image = this.getAttribute('image') ?? '';

    const a = document.createElement('a');
    a.className = 'card project-card';
    a.href = href; a.target = '_blank'; a.rel = 'noopener';

    const thumb = document.createElement('div');
    thumb.className = 'thumb';
    if (image) {
      const img = document.createElement('img');
      img.src = image;
      img.alt = title || 'Project preview';
      thumb.appendChild(img);
    } else {
      const ph = document.createElement('div');
      ph.className = 'thumb-ph';
      ph.textContent = 'No preview';
      thumb.appendChild(ph);
    }

    const meta = document.createElement('div');
    meta.className = 'meta';
    const h3 = document.createElement('h3'); h3.textContent = title;
    const p  = document.createElement('p');  p.textContent  = desc;

    meta.append(h3, p);
    a.append(thumb, meta);
    this.replaceChildren(a);
  }
});


customElements.define('projects-grid', class extends HTMLElement{
  static get observedAttributes(){ return ['src','heading','subheading']; }
  _loadedFor = null;     // remember which src we loaded
  _loading   = false;

  connectedCallback(){
    this.render();
    if (this.getAttribute('src')) this.load();
  }

  attributeChangedCallback(name){
    if (name === 'src') this.load();
    if (name === 'heading' || name === 'subheading') this.render();
  }

  render(){
    const heading = this.getAttribute('heading') ?? 'Projects';
    const sub = this.getAttribute('subheading') ?? '';
    this.innerHTML = html`
      <section class="stack container">
        <h2>${heading}</h2>
        ${sub ? `<p class="muted">${sub}</p>` : ''}
        <div class="grid"><slot></slot></div>
        <p><slot name="more"></slot></p>
      </section>
    `;
  }

  async load(){
    const src = this.getAttribute('src');
    if (!src || this._loadedFor === src || this._loading) return;

    this._loading = true;
    this._loadedFor = src;

    try {
      const url = new URL(src, this.baseURI).href;
      const res = await fetch(url, { headers: { 'Accept': 'application/json' }});
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);

      const items = await res.json();

      // clear previous auto cards
      this.querySelectorAll('project-card[data-auto]').forEach(el => el.remove());

      const grid = this.querySelector('.grid');
      grid.innerHTML = ''; // reset

      const showCount = 6; // how many to show on homepage

      // render up to 6 projects
      items.slice(0, showCount).forEach(item => {
        const card = document.createElement('project-card');
        if (item.href)  card.setAttribute('href', item.href);
        if (item.title) card.setAttribute('title', item.title);
        if (item.desc)  card.setAttribute('desc', item.desc);
        if (item.image) card.setAttribute('image', item.image);
        card.dataset.auto = 'true';
        grid.appendChild(card);
      });

      // if there are more than 6, show a “view more” button automatically
      const moreSlot = this.querySelector('[slot="more"]');
      if (items.length > showCount) {
        if (moreSlot) {
          moreSlot.style.display = 'block';
        } else {
          const link = document.createElement('a');
          link.href = '/projects.html';
          link.textContent = 'View all my projects →';
          link.className = 'view-more-btn';
          link.slot = 'more';
          this.appendChild(link);
        }
      } else {
        if (moreSlot) moreSlot.style.display = 'none';
      }

    } catch (err) {
      console.error('Failed to load projects:', err);
      let msg = this.querySelector('[data-load-error]');
      if (!msg) {
        msg = document.createElement('p');
        msg.className = 'muted';
        msg.dataset.loadError = 'true';
        this.appendChild(msg);
      }
      msg.textContent = 'Could not load projects right now.';
    } finally {
      this._loading = false;
    }
  }

});


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
    a.className = 'card project-card'; // reuse same card styles
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


customElements.define('blogs-grid', class extends HTMLElement{
  static get observedAttributes(){ return ['src','heading','subheading','show','all-href']; }
  _loadedFor = null; _loading = false;

  connectedCallback(){
    this.render();
    if (this.getAttribute('src')) this.load();
  }

  attributeChangedCallback(n){
    if (n==='src') this.load();
    if (n==='heading'||n==='subheading') this.render();
  }

  render(){
    const heading = this.getAttribute('heading') ?? 'Latest posts';
    const sub     = this.getAttribute('subheading') ?? '';
    this.innerHTML = `
      <section class="stack container">
        <h2>${heading}</h2>
        ${sub ? `<p class="muted">${sub}</p>` : ''}
        <div class="grid"><slot></slot></div>
        <p><slot name="more"></slot></p>
      </section>
    `;
  }

  async load(){
    const src = this.getAttribute('src');
    if (!src || this._loading || this._loadedFor === src) return;
    this._loading = true; this._loadedFor = src;

    try {
      const url = new URL(src, this.baseURI).href;
      const res = await fetch(url, { headers: { 'Accept': 'application/json' }});
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);

      const items = await res.json();
      const grid = this.querySelector('.grid');
      grid.innerHTML = '';

      const showCount = parseInt(this.getAttribute('show') || '6', 10);

      // Render up to `showCount` posts
      items.slice(0, showCount).forEach(item => {
        const card = document.createElement('blog-card');
        // link to single post page by slug
        const slug = item.slug || item.href?.split('/').pop();
        const href = slug ? `/posts/post.html?slug=${encodeURIComponent(slug)}` : (item.href || '#');

        card.setAttribute('href', href);
        if (item.title) card.setAttribute('title', item.title);
        if (item.desc)  card.setAttribute('desc', item.desc);
        if (item.image) card.setAttribute('image', item.image);
        if (item.date)  card.setAttribute('date', item.date);
        card.dataset.auto = 'true';
        grid.appendChild(card);
      });

      // Handle the "View all posts" button
      const moreSlot = this.querySelector('[slot="more"]');
      const allHref  = this.getAttribute('all-href') || '/posts.html';
      if (items.length > showCount){
        if (moreSlot) moreSlot.style.display = 'block';
        else{
          const a = document.createElement('a');
          a.slot = 'more'; a.className = 'view-more-btn';
          a.href = allHref;
          a.textContent = 'View all posts →';
          this.appendChild(a);
        }
      } else if (moreSlot){
        moreSlot.style.display = 'none';
      }

    } catch(err){
      console.error('Failed to load posts:', err);
      const msg = document.createElement('p');
      msg.className = 'muted';
      msg.textContent = 'Could not load posts right now.';
      this.appendChild(msg);
    } finally {
      this._loading = false;
    }
  }
});


customElements.define('blogs-grid', class extends HTMLElement{
  static get observedAttributes(){ return ['src','heading','subheading','show','all-href']; }
  _loadedFor = null; _loading = false;

  connectedCallback(){ this.render(); if (this.getAttribute('src')) this.load(); }
  attributeChangedCallback(n){ if (n==='src') this.load(); if (n==='heading'||n==='subheading') this.render(); }

  render(){
    const heading = this.getAttribute('heading') ?? 'Latest posts';
    const sub     = this.getAttribute('subheading') ?? '';
    this.innerHTML = `
      <section class="stack container">
        <h2>${heading}</h2>
        ${sub ? `<p class="muted">${sub}</p>` : ''}
        <div class="grid"><slot></slot></div>
        <p><slot name="more"></slot></p>
      </section>
    `;
  }

  async load(){
    const src = this.getAttribute('src');
    if (!src || this._loadedFor === src || this._loading) return;
    this._loading = true; this._loadedFor = src;

    try{
      const url = new URL(src, this.baseURI).href;
      const res = await fetch(url, { headers: {'Accept':'application/json'} });
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      const items = await res.json();

      const grid = this.querySelector('.grid');
      grid.innerHTML = '';

      const showCount = parseInt(this.getAttribute('show') || '6', 10);
      items.slice(0, showCount).forEach(item => {
        const card = document.createElement('blog-card');
        if (item.href)  card.setAttribute('href', item.href);
        if (item.title) card.setAttribute('title', item.title);
        if (item.desc)  card.setAttribute('desc', item.desc);
        if (item.image) card.setAttribute('image', item.image);
        if (item.date)  card.setAttribute('date', item.date);
        card.dataset.auto = 'true';
        grid.appendChild(card);
      });

      // auto "View all" button
      const moreSlot = this.querySelector('[slot="more"]');
      const allHref  = this.getAttribute('all-href') || '/posts.html';
      if (items.length > showCount){
        if (moreSlot) moreSlot.style.display = 'block';
        else{
          const a = document.createElement('a');
          a.slot = 'more'; a.className = 'view-more-btn';
          a.href = allHref; a.textContent = 'View all posts →';
          this.appendChild(a);
        }
      } else if (moreSlot){ moreSlot.style.display = 'none'; }

    } catch(err){
      console.error('Failed to load posts:', err);
      const p = document.createElement('p');
      p.className = 'muted'; p.textContent = 'Could not load posts right now.';
      this.appendChild(p);
    } finally { this._loading = false; }
  }
});


// <site-footer>
customElements.define('site-footer', class extends HTMLElement{
  connectedCallback(){
    const year = this.getAttribute('year') ?? new Date().getFullYear();
    this.innerHTML = `
      <footer class="site-footer">
        <div class="container footer-inner">
          <span>© ${year} Katerina Lazari</span>
          <div class="social"><slot></slot></div>
        </div>
      </footer>
    `;
    const style = document.createElement('style');
    style.textContent = `
      .site-footer{ border-top:1px solid color-mix(in oklab,var(--text) 10%,transparent); margin-top:32px;}
      .footer-inner{ display:flex; align-items:center; justify-content:space-between; gap:12px; padding:18px 16px;}
      .social a{ margin-left:12px; color:var(--text); text-decoration:none; opacity:.9;}
      .social a:hover{ opacity:1;}
    `;
    this.prepend(style);
  }
});


/* components.js — cards that read from posts.json / projects.json
   Usage (home page):
   <blogs-grid src="/posts.json" heading="Latest posts" show="3" all-href="/post/"></blogs-grid>
   <blogs-grid src="/projects.json" heading="Projects" show="6" all-href="/projects/"></blogs-grid>
*/

(() => {
  // ---------- Utils ----------
  const slugify = (s = "") =>
    s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const guessKindFromSrc = (src = "") =>
    src.toLowerCase().includes("post") ? "post" :
    src.toLowerCase().includes("project") ? "project" : "auto";
  const toPostUrl = (item) => `/post/?p=${item.slug ?? slugify(item.title)}`;
  const toProjectUrl = (item) => `/projects/?p=${item.slug ?? slugify(item.title)}`;
  const fmtDate = (d) => {
    const dt = new Date(d);
    return isNaN(dt) ? "" : dt.toLocaleDateString(undefined, { year:"numeric", month:"short", day:"numeric" });
  };
  const escapeHtml = (s = "") =>
    s.replace(/[&<>"']/g, (m) => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[m]));

  // ---------- Card renderers ----------
  const renderPostCard = (item) => `
    <a class="card" href="/post/?p=${item.slug}"">
      ${item.image ? `<div class="card-media"><img src="${item.image}" alt=""></div>` : ""}
      <div class="card-body">
        ${item.date ? `<p class="small muted">${fmtDate(item.date)}</p>` : ""}
        <h3 class="card-title">${escapeHtml(item.title)}</h3>
        ${item.desc ? `<p class="muted">${escapeHtml(item.desc)}</p>` : ""}
        <span class="arrow">Read →</span>
      </div>
    </a>`;

  const renderProjectCard = (item) => `
    <a class="card" href="${toProjectUrl(item)}">
      ${item.image ? `<div class="card-media"><img src="${item.image}" alt=""></div>` : ""}
      <div class="card-body">
        <h3 class="card-title">${escapeHtml(item.title)}</h3>
        ${item.desc ? `<p class="muted">${escapeHtml(item.desc)}</p>` : ""}
        <span class="arrow">Open →</span>
      </div>
    </a>`;

  // ---------- <blogs-grid> ----------
  customElements.define("blogs-grid", class extends HTMLElement {
    static get observedAttributes(){ return ["src","heading","subheading","show","all-href"]; }
    _data = []; _loading = false; _loadedFor = null;

    connectedCallback(){ this.renderShell(); if (this.getAttribute("src")) this.load(); }
    attributeChangedCallback(n){ if(n==="src") this.load(); if(["heading","subheading","all-href","show"].includes(n)){ this.renderShell(); this.populate(); } }

    renderShell(){
      const heading = this.getAttribute("heading") ?? "Latest";
      const sub     = this.getAttribute("subheading") ?? "";
      const allHref = this.getAttribute("all-href") ?? "";
      const more    = allHref ? `<a class="inline-btn" href="${allHref}">View all →</a>` : "";
      this.innerHTML = `
        <section class="stack container">
          <h2>${escapeHtml(heading)}</h2>
          ${sub ? `<p class="muted">${escapeHtml(sub)}</p>` : ""}
          <div class="grid" part="grid"></div>
          ${more ? `<p>${more}</p>` : ""}
        </section>
      `;
    }

    async load(){
      if (this._loading) return;
      const src = this.getAttribute("src");
      if (!src || src === this._loadedFor) return;
      this._loading = true;

      const grid = this.querySelector('[part="grid"]');
      if (grid) grid.innerHTML = `<p class="muted">Loading…</p>`;

      try {
        const res = await fetch(src, { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (!Array.isArray(json)) throw new Error("JSON must be an array");
        this._data = json;
        this._loadedFor = src;
        this.populate();
      } catch (e) {
        if (grid) grid.innerHTML = `<p class="muted">Could not load <code>${src}</code>: ${e.message}</p>`;
      } finally {
        this._loading = false;
      }
    }

    populate(){
      const grid = this.querySelector('[part="grid"]');
      if (!grid || !this._data.length) { if(grid) grid.innerHTML = `<p class="muted">Nothing to show yet.</p>`; return; }

      const show = Number(this.getAttribute("show") || 0);
      const items = show > 0 ? this._data.slice(0, show) : this._data;

      let kind = guessKindFromSrc(this.getAttribute("src") || "");
      if (kind === "auto") {
        const f = items[0] ?? {};
        kind = ("date" in f || "slug" in f) ? "post" : "project";
      }

      grid.innerHTML = items.map(i => kind === "post" ? renderPostCard(i) : renderProjectCard(i)).join("");
    }
  });

  // ---------- Optional header/footer (only if not already defined) ----------
  if (!customElements.get("site-header")) {
    customElements.define("site-header", class extends HTMLElement {
      connectedCallback(){
        if (this.childElementCount) return;
        const brand = this.getAttribute("brand") ?? "✦";
        this.innerHTML = `
          <header class="site-header">
            <div class="container header-inner">
              <a class="brand" href="/">${brand}</a>
              <nav class="nav"><slot></slot></nav>
            </div>
          </header>`;
      }
    });
  }
  if (!customElements.get("site-footer")) {
    customElements.define("site-footer", class extends HTMLElement {
      connectedCallback(){
        if (this.childElementCount) return;
        const year = this.getAttribute("year") ?? new Date().getFullYear();
        this.innerHTML = `
          <footer class="site-footer">
            <div class="container footer-inner">
              <small class="muted">© ${year}</small>
              <nav class="nav"><slot></slot></nav>
            </div>
          </footer>`;
      }
    });
  }
})();
