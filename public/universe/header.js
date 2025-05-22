export class Header {
  constructor(users, onUserSelect) {
    this.users = users;
    this.onUserSelect = onUserSelect;
    this.findMeResults = [];
    this.findMeSelected = -1;
    this.isMobile = /Mobi|Android/i.test(navigator.userAgent);
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
      /* Mobile-specific styles */
      @media (max-width: 768px) {
        .mobile-optimized {
          -webkit-tap-highlight-color: transparent;
          touch-action: manipulation;
          user-select: none;
          -webkit-user-select: none;
        }
        .mobile-input {
          font-size: 16px !important; /* Prevent iOS zoom on focus */
          padding: 0 12px !important;
        }
        .mobile-dropdown {
          max-height: 50vh !important;
          -webkit-overflow-scrolling: touch;
        }
      }
    `;
    document.head.appendChild(styleSheet);

    // Header container
    this.container = document.createElement('div');
    this.container.style.position = 'fixed';
    this.container.style.top = '0';
    this.container.style.left = '0';
    this.container.style.right = '0';
    this.container.style.height = this.isMobile ? '56px' : '64px'; // Slightly smaller on mobile
    this.container.style.display = 'flex';
    this.container.style.alignItems = 'center';
    this.container.style.justifyContent = 'center';
    this.container.style.padding = this.isMobile ? '0 16px' : '0 24px';
    this.container.style.background = 'transparent';
    this.container.style.backdropFilter = 'blur(10px)';
    this.container.style.zIndex = '2000';
    this.container.style.opacity = '0';
    this.container.style.transition = 'opacity 0.3s ease';
    this.container.className = 'mobile-optimized';

    // Search container
    const searchContainer = document.createElement('div');
    searchContainer.style.position = 'relative';
    searchContainer.style.display = 'flex';
    searchContainer.style.alignItems = 'center';
    searchContainer.style.justifyContent = 'center';
    searchContainer.style.width = '100%';
    searchContainer.style.maxWidth = this.isMobile ? '100%' : '400px';

    // Search input
    this.input = document.createElement('input');
    this.input.type = 'text';
    this.input.placeholder = 'Find me...';
    this.input.style.width = '100%';
    this.input.style.height = this.isMobile ? '36px' : '40px';
    this.input.style.lineHeight = this.isMobile ? '36px' : '40px';
    this.input.style.padding = '0 16px';
    this.input.style.borderRadius = '20px';
    this.input.style.border = 'none';
    this.input.style.background = 'rgba(255,255,255,0.1)';
    this.input.style.color = '#fff';
    this.input.style.fontSize = '14px';
    this.input.style.outline = 'none';
    this.input.style.textAlign = 'center';
    this.input.setAttribute('aria-label', 'Search users by handle or name');
    this.input.className = 'mobile-optimized mobile-input';

    const searchWrapper = document.createElement('div');
    searchWrapper.style.display = 'flex';
    searchWrapper.style.alignItems = 'center';
    searchWrapper.style.justifyContent = 'center';
    searchWrapper.style.background = 'transparent';
    searchWrapper.style.borderRadius = '24px';
    searchWrapper.style.padding = this.isMobile ? '2px 8px' : '4px 12px';
    searchWrapper.style.marginRight = this.isMobile ? '8px' : '12px';
    searchWrapper.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
    searchWrapper.appendChild(this.input);

    // Add My Star button
    const addMeBtn = document.createElement('a');
    addMeBtn.innerHTML = 'Add My Star';
    addMeBtn.href = 'https://buy.stripe.com/aFadRa0wH7rW2Q4gDTb3q03';
    addMeBtn.target = '_blank';
    addMeBtn.className = 'pulse-hover cosmic-gradient mobile-optimized';
    addMeBtn.style.display = 'inline-block';
    addMeBtn.style.height = this.isMobile ? '36px' : '40px';
    addMeBtn.style.lineHeight = this.isMobile ? '36px' : '40px';
    addMeBtn.style.padding = this.isMobile ? '0 16px' : '0 22px';
    addMeBtn.style.borderRadius = '100px';
    addMeBtn.style.color = '#fff';
    addMeBtn.style.fontWeight = '600';
    addMeBtn.style.fontSize = this.isMobile ? '13px' : '14px';
    addMeBtn.style.letterSpacing = '0.5px';
    addMeBtn.style.border = '1px solid rgba(255,255,255,0.1)';
    addMeBtn.style.backdropFilter = 'blur(6px)';
    addMeBtn.style.textDecoration = 'none';
    addMeBtn.style.boxShadow = '0 0 10px rgba(255,110,196,0.3)';
    addMeBtn.style.transition = 'transform 0.2s, box-shadow 0.2s';
    addMeBtn.style.marginLeft = this.isMobile ? '8px' : '12px';
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
    this.dropdown.style.maxHeight = this.isMobile ? '50vh' : '300px';
    this.dropdown.style.overflowY = 'auto';
    this.dropdown.style.zIndex = '2001';
    this.dropdown.className = 'mobile-optimized mobile-dropdown';

    searchContainer.appendChild(this.dropdown);
    this.container.appendChild(searchContainer);
    document.body.appendChild(this.container);

    this.setupEventListeners();
  }

  setupEventListeners() {
    // Debounce search for better mobile performance
    let searchTimeout;
    const debouncedSearch = (val) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        this.performSearch(val);
      }, this.isMobile ? 150 : 100); // Slightly longer debounce on mobile
    };

    this.input.addEventListener('input', () => {
      const val = this.input.value.trim().toLowerCase();
      if (!val) {
        this.dropdown.style.display = 'none';
        this.dropdown.innerHTML = '';
        this.findMeResults = [];
        this.findMeSelected = -1;
        return;
      }
      debouncedSearch(val);
    });

    // Mobile-specific touch handling
    if (this.isMobile) {
      this.input.addEventListener('touchstart', (e) => {
        e.stopPropagation();
      }, { passive: true });

      this.dropdown.addEventListener('touchstart', (e) => {
        e.stopPropagation();
      }, { passive: true });

      // Prevent iOS zoom on input focus
      this.input.addEventListener('focus', () => {
        setTimeout(() => {
          this.input.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 300);
      });
    }

    this.input.addEventListener('blur', () => {
      setTimeout(() => {
        this.dropdown.style.display = 'none';
      }, 100);
    });

    this.input.addEventListener('keydown', (e) => {
      if (!this.findMeResults.length) return;

      if (e.key === 'ArrowDown') {
        this.findMeSelected = (this.findMeSelected + 1) % this.findMeResults.length;
        this.updateDropdownSelection();
        e.preventDefault();
      } else if (e.key === 'ArrowUp') {
        this.findMeSelected = (this.findMeSelected - 1 + this.findMeResults.length) % this.findMeResults.length;
        this.updateDropdownSelection();
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

  performSearch(val) {
    this.findMeResults = this.users.filter(u =>
      (u.handle && u.handle.toLowerCase().includes(val)) ||
      (u.name && u.name.toLowerCase().includes(val))
    ).slice(0, this.isMobile ? 3 : 4); // Show fewer results on mobile

    this.dropdown.innerHTML = '';
    this.findMeResults.forEach((u, idx) => {
      const row = document.createElement('div');
      row.style.display = 'flex';
      row.style.alignItems = 'center';
      row.style.gap = '10px';
      row.style.padding = this.isMobile ? '12px' : '8px 12px';
      row.style.cursor = 'pointer';
      row.style.background = idx === this.findMeSelected ? 'rgba(80,80,120,0.25)' : 'none';
      row.className = 'mobile-optimized';

      // Use touch events for mobile
      if (this.isMobile) {
        row.addEventListener('touchstart', (e) => {
          e.preventDefault();
          this.onUserSelect(u);
          this.input.value = '';
          this.dropdown.style.display = 'none';
        }, { passive: false });
      } else {
        row.addEventListener('mouseenter', () => {
          this.findMeSelected = idx;
          this.updateDropdownSelection();
        });

        row.addEventListener('mouseleave', () => {
          this.findMeSelected = -1;
          this.updateDropdownSelection();
        });

        row.addEventListener('mousedown', (e) => {
          e.preventDefault();
          this.onUserSelect(u);
          this.input.value = '';
          this.dropdown.style.display = 'none';
        });
      }

      const img = document.createElement('img');
      img.src = `/pfp/${u.handle}.jpg`;
      img.style.width = this.isMobile ? '36px' : '32px';
      img.style.height = this.isMobile ? '36px' : '32px';
      img.style.borderRadius = '50%';
      img.style.objectFit = 'cover';
      img.style.boxShadow = '0 0 6px rgba(0,0,0,0.2)';
      row.appendChild(img);

      const handle = document.createElement('span');
      handle.innerText = '@' + u.handle;
      handle.style.fontSize = this.isMobile ? '16px' : '15px';
      handle.style.color = '#fff';
      row.appendChild(handle);

      this.dropdown.appendChild(row);
    });

    if (!this.findMeResults.length) {
      const noResult = document.createElement('div');
      noResult.innerText = 'No users found';
      noResult.style.padding = this.isMobile ? '16px' : '8px 12px';
      noResult.style.color = '#aaa';
      noResult.style.fontSize = this.isMobile ? '16px' : '14px';
      this.dropdown.appendChild(noResult);
    }

    this.dropdown.style.display = 'block';
    this.findMeSelected = -1;
  }

  updateDropdownSelection() {
    Array.from(this.dropdown.children).forEach((c, i) =>
      c.style.background = i === this.findMeSelected ? 'rgba(80,80,120,0.25)' : 'none'
    );
  }

  show() {
    this.container.style.opacity = '1';
  }

  hide() {
    this.container.style.opacity = '0';
  }
}
