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

// <projects-grid> + <project-card>
customElements.define('projects-grid', class extends HTMLElement{
  connectedCallback(){
    const heading = this.getAttribute('heading') ?? 'Projects';
    const sub = this.getAttribute('subheading') ?? '';
    this.innerHTML = `
      <section class="stack container">
        <h2>${heading}</h2>
        <p class="muted">${sub}</p>
        <div class="grid"><slot></slot></div>
        <p><slot name="more"></slot></p>
      </section>
    `;
  }
});
customElements.define('project-card', class extends HTMLElement{
  connectedCallback(){
    const href = this.getAttribute('href') ?? '#';
    const title = this.getAttribute('title') ?? '';
    const desc = this.getAttribute('desc') ?? '';
    this.innerHTML = `<a class="card" href="${href}" target="_blank" rel="noopener">
      <h3>${title}</h3><p>${desc}</p></a>`;
  }
});

// <posts-list> + <post-item>
customElements.define('posts-list', class extends HTMLElement{
  connectedCallback(){
    const heading = this.getAttribute('heading') ?? 'Writings';
    const sub = this.getAttribute('subheading') ?? '';
    this.innerHTML = `
      <section class="stack container">
        <h2>${heading}</h2>
        <p class="muted">${sub}</p>
        <div class="posts"><slot></slot></div>
        <p><slot name="more"></slot></p>
      </section>
    `;
  }
});
customElements.define('post-item', class extends HTMLElement{
  connectedCallback(){
    const title = this.getAttribute('title') ?? '';
    const href = this.getAttribute('href') ?? '#';
    const date = this.getAttribute('date') ?? '';
    const body = this.innerHTML;
    this.innerHTML = `
      <article class="post">
        <h3><a href="${href}">${title}</a></h3>
        <p class="muted small">Posted on ${new Date(date).toLocaleDateString(undefined, {year:'numeric', month:'short', day:'2-digit'})}</p>
        <p>${body}</p>
      </article>
    `;
  }
});

// <subscribe-box>
customElements.define('subscribe-box', class extends HTMLElement{
  connectedCallback(){
    const heading = this.getAttribute('heading') ?? 'Subscribe';
    const rss = this.getAttribute('rss') ?? '/rss.xml';
    const services = JSON.parse(this.getAttribute('services') || '[]');
    const links = services.map(s => `<a href="${s.href}">${s.name}</a>`).join(', ');
    this.innerHTML = `
      <section class="stack container">
        <h2>${heading}</h2>
        <p>Get updates via ${links}${links && rss ? ', ' : ''}<a href="${rss}">RSS</a>.</p>
        <form class="subscribe" onsubmit="alert('Pretend we subscribed you!'); return false;">
          <input type="email" placeholder="your@email.com" required />
          <button type="submit">Subscribe</button>
        </form>
      </section>
    `;
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
