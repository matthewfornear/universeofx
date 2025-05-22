export class Header {
  constructor(users, onUserSelect) {
    this.users = users;
    this.onUserSelect = onUserSelect;
    this.findMeResults = [];
    this.findMeSelected = -1;
    this.createHeader();
  }

  createHeader() {
    // Add pulse and cosmic gradient animation to head
    const styleSheet = document.createElement('style');
    styleSheet.innerHTML = `
      @keyframes pulse {
        0% { transform: scale(1); box-shadow: 0 0 10px rgba(255,110,196,0.3); }
        50% { transform: scale(1.04); box-shadow: 0 0 18px rgba(255,110,196,0.5); }
        100% { transform: scale(1); box-shadow: 0 0 10px rgba(255,110,196,0.3); }
      }
      .pulse-hover:hover {
        animation: pulse 2s infinite;
      }
      @keyframes cosmicShift {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
      }
      .cosmic-gradient {
        background: linear-gradient(270deg, #8247e5, #ff6ec4, #ffcc70);
        background-size: 600% 600%;
        animation: cosmicShift 8s ease infinite;
      }
    `;
    document.head.appendChild(styleSheet);

    // Header container
    this.container = document.createElement('div');
    this.container.style.position = 'fixed';
    this.container.style.top = '0';
    this.container.style.left = '0';
    this.container.style.right = '0';
    this.container.style.height = '64px';
    this.container.style.display = 'flex';
    this.container.style.alignItems = 'center';
    this.container.style.justifyContent = 'center';
    this.container.style.padding = '0 24px';
    this.container.style.background = 'transparent';
    this.container.style.backdropFilter = 'blur(10px)';
    this.container.style.zIndex = '2000';
    this.container.style.opacity = '0';
    this.container.style.transition = 'opacity 0.3s ease';

    // Search container
    const searchContainer = document.createElement('div');
    searchContainer.style.position = 'relative';
    searchContainer.style.display = 'flex';
    searchContainer.style.alignItems = 'center';
    searchContainer.style.justifyContent = 'center';
    searchContainer.style.width = '100%';
    searchContainer.style.maxWidth = '400px';

    // Search input
    this.input = document.createElement('input');
    this.input.type = 'text';
    this.input.placeholder = 'Find me...';
    this.input.style.width = '100%';
    this.input.style.height = '40px';
    this.input.style.lineHeight = '40px';
    this.input.style.padding = '0 16px';
    this.input.style.borderRadius = '20px';
    this.input.style.border = 'none';
    this.input.style.background = 'rgba(255,255,255,0.1)';
    this.input.style.color = '#fff';
    this.input.style.fontSize = '14px';
    this.input.style.outline = 'none';
    this.input.style.textAlign = 'center';
    this.input.setAttribute('aria-label', 'Search users by handle or name');

    const searchWrapper = document.createElement('div');
    searchWrapper.style.display = 'flex';
    searchWrapper.style.alignItems = 'center';
    searchWrapper.style.justifyContent = 'center';
    searchWrapper.style.background = 'transparent';
    searchWrapper.style.borderRadius = '24px';
    searchWrapper.style.padding = '4px 12px';
    searchWrapper.style.marginRight = '12px';
    searchWrapper.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
    searchWrapper.appendChild(this.input);

    // Add My Star button
    const addMeBtn = document.createElement('a');
    addMeBtn.innerHTML = 'Add My Star';
    addMeBtn.href = 'https://buy.stripe.com/aFadRa0wH7rW2Q4gDTb3q03';
    addMeBtn.target = '_blank';
    addMeBtn.className = 'pulse-hover cosmic-gradient';
    addMeBtn.style.display = 'inline-block';
    addMeBtn.style.height = '40px';
    addMeBtn.style.lineHeight = '40px';
    addMeBtn.style.padding = '0 22px';
    addMeBtn.style.borderRadius = '100px';
    addMeBtn.style.color = '#fff';
    addMeBtn.style.fontWeight = '600';
    addMeBtn.style.fontSize = '14px';
    addMeBtn.style.letterSpacing = '0.5px';
    addMeBtn.style.border = '1px solid rgba(255,255,255,0.1)';
    addMeBtn.style.backdropFilter = 'blur(6px)';
    addMeBtn.style.textDecoration = 'none';
    addMeBtn.style.boxShadow = '0 0 10px rgba(255,110,196,0.3)';
    addMeBtn.style.transition = 'transform 0.2s, box-shadow 0.2s';
    addMeBtn.style.marginLeft = '12px';
    addMeBtn.style.overflow = 'visible';
    addMeBtn.style.cursor = 'pointer';
    addMeBtn.style.zIndex = '9999';

    searchContainer.appendChild(searchWrapper);
    searchContainer.appendChild(addMeBtn);

    // Dropdown
    this.dropdown = document.createElement('div');
    this.dropdown.style.position = 'absolute';
    this.dropdown.style.top = '100%';
    this.dropdown.style.left = '0';
    this.dropdown.style.right = '0';
    this.dropdown.style.marginTop = '8px';
    this.dropdown.style.background = 'rgba(28,28,30,0.95)';
    this.dropdown.style.borderRadius = '12px';
    this.dropdown.style.boxShadow = '0 4px 20px rgba(0,0,0,0.25)';
    this.dropdown.style.backdropFilter = 'blur(10px)';
    this.dropdown.style.display = 'none';
    this.dropdown.style.maxHeight = '300px';
    this.dropdown.style.overflowY = 'auto';
    this.dropdown.style.zIndex = '2001';

    searchContainer.appendChild(this.dropdown);
    this.container.appendChild(searchContainer);
    document.body.appendChild(this.container);

    this.setupEventListeners();
  }

  setupEventListeners() {
    this.input.addEventListener('input', () => {
      const val = this.input.value.trim().toLowerCase();
      if (!val) {
        this.dropdown.style.display = 'none';
        this.dropdown.innerHTML = '';
        this.findMeResults = [];
        this.findMeSelected = -1;
        return;
      }

      this.findMeResults = this.users.filter(u =>
        (u.handle && u.handle.toLowerCase().includes(val)) ||
        (u.name && u.name.toLowerCase().includes(val))
      ).slice(0, 4);

      this.dropdown.innerHTML = '';
      this.findMeResults.forEach((u, idx) => {
        const row = document.createElement('div');
        row.style.display = 'flex';
        row.style.alignItems = 'center';
        row.style.gap = '10px';
        row.style.padding = '8px 12px';
        row.style.cursor = 'pointer';
        row.style.background = idx === this.findMeSelected ? 'rgba(80,80,120,0.25)' : 'none';

        row.addEventListener('mouseenter', () => {
          this.findMeSelected = idx;
          Array.from(this.dropdown.children).forEach((c, i) =>
            c.style.background = i === idx ? 'rgba(80,80,120,0.25)' : 'none'
          );
        });

        row.addEventListener('mouseleave', () => {
          this.findMeSelected = -1;
          Array.from(this.dropdown.children).forEach(c => c.style.background = 'none');
        });

        row.addEventListener('mousedown', (e) => {
          e.preventDefault();
          this.onUserSelect(u);
          this.input.value = '';
          this.dropdown.style.display = 'none';
        });

        const img = document.createElement('img');
        img.src = `/pfp/${u.handle}.jpg`;
        img.style.width = '32px';
        img.style.height = '32px';
        img.style.borderRadius = '50%';
        img.style.objectFit = 'cover';
        img.style.boxShadow = '0 0 6px rgba(0,0,0,0.2)';
        row.appendChild(img);

        const handle = document.createElement('span');
        handle.innerText = '@' + u.handle;
        handle.style.fontSize = '15px';
        handle.style.color = '#fff';
        row.appendChild(handle);

        this.dropdown.appendChild(row);
      });

      if (!this.findMeResults.length) {
        const noResult = document.createElement('div');
        noResult.innerText = 'No users found';
        noResult.style.padding = '8px 12px';
        noResult.style.color = '#aaa';
        this.dropdown.appendChild(noResult);
      }

      this.dropdown.style.display = 'block';
      this.findMeSelected = -1;
    });

    this.input.addEventListener('blur', () => {
      setTimeout(() => {
        this.dropdown.style.display = 'none';
      }, 100);
    });

    this.input.addEventListener('keydown', (e) => {
      if (!this.findMeResults.length) return;

      if (e.key === 'ArrowDown') {
        this.findMeSelected = (this.findMeSelected + 1) % this.findMeResults.length;
        Array.from(this.dropdown.children).forEach((c, i) =>
          c.style.background = i === this.findMeSelected ? 'rgba(80,80,120,0.25)' : 'none'
        );
        e.preventDefault();
      } else if (e.key === 'ArrowUp') {
        this.findMeSelected = (this.findMeSelected - 1 + this.findMeResults.length) % this.findMeResults.length;
        Array.from(this.dropdown.children).forEach((c, i) =>
          c.style.background = i === this.findMeSelected ? 'rgba(80,80,120,0.25)' : 'none'
        );
        e.preventDefault();
      } else if (e.key === 'Enter') {
        if (this.findMeSelected >= 0 && this.findMeSelected < this.findMeResults.length) {
          this.onUserSelect(this.findMeResults[this.findMeSelected]);
        } else if (this.findMeResults.length) {
          this.onUserSelect(this.findMeResults[0]);
        }
        this.input.value = '';
        this.dropdown.style.display = 'none';
        e.preventDefault();
      } else if (e.key === 'Escape') {
        this.dropdown.style.display = 'none';
        this.input.value = '';
        this.findMeResults = [];
        this.findMeSelected = -1;
      }
    });

    this.input.addEventListener('focus', () => {
      this.input.style.background = 'rgba(255,255,255,0.15)';
    });
  }

  show() {
    this.container.style.opacity = '1';
  }

  hide() {
    this.container.style.opacity = '0';
  }
}
