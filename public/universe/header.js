// Header component for Universe of Builders
export class Header {
  constructor(users, onUserSelect) {
    this.users = users;
    this.onUserSelect = onUserSelect;
    this.findMeResults = [];
    this.findMeSelected = -1;
    this.createHeader();
  }

  createHeader() {
    // Create header container
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
    this.container.style.background = 'rgba(28,28,30,0.8)';
    this.container.style.backdropFilter = 'blur(10px)';
    this.container.style.zIndex = '2000';
    this.container.style.opacity = '0';
    this.container.style.transition = 'opacity 0.3s ease';

    // Create search container
    const searchContainer = document.createElement('div');
    searchContainer.style.position = 'relative';
    searchContainer.style.width = '100%';
    searchContainer.style.maxWidth = '400px';

    // Create search input
    this.input = document.createElement('input');
    this.input.type = 'text';
    this.input.placeholder = 'Find me...';
    this.input.style.width = '100%';
    this.input.style.padding = '8px 16px';
    this.input.style.borderRadius = '20px';
    this.input.style.border = 'none';
    this.input.style.background = 'rgba(255,255,255,0.1)';
    this.input.style.color = '#fff';
    this.input.style.fontSize = '14px';
    this.input.style.outline = 'none';
    this.input.style.transition = 'all 0.2s ease';
    this.input.setAttribute('aria-label', 'Search users by handle or name');

    // Create dropdown
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

    // Add elements to DOM
    searchContainer.appendChild(this.input);
    searchContainer.appendChild(this.dropdown);
    this.container.appendChild(searchContainer);
    document.body.appendChild(this.container);

    // Add event listeners
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

      // Search users by handle or name (partial, case-insensitive)
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
        row.style.transition = 'background 0.2s ease';

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

      // Show 'No users found' if no results
      if (!this.findMeResults.length) {
        const noResult = document.createElement('div');
        noResult.innerText = 'No users found';
        noResult.style.padding = '8px 12px';
        noResult.style.color = '#aaa';
        this.dropdown.appendChild(noResult);
      }

      this.dropdown.style.display = this.findMeResults.length ? 'block' : 'block';
      this.findMeSelected = -1;
    });

    // Dropdown closes on blur
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
        return;
      }
    });

    // Add hover effects
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