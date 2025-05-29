// Navigation and UI enhancements
document.addEventListener('DOMContentLoaded', () => {
  // Create sidebar if it doesn't exist
  if (!document.querySelector('.sidebar')) {
    createSidebar();
  }

  // Setup page transitions
  setupPageTransitions();
  
  // Add theme toggle capability
  setupThemeToggle();

  // Handle initial sidebar state (collapsed on mobile)
  handleInitialSidebarState();
});

// Create sidebar with smooth animations
function createSidebar() {
  // Create the sidebar element
  const sidebar = document.createElement('div');
  sidebar.className = 'sidebar collapsed';
  sidebar.innerHTML = `
    <div class="sidebar-header">
      <div class="sidebar-logo">
        <span class="logo-icon">☯</span>
        <span class="logo-text">Aion</span>
      </div>
      <button class="sidebar-toggle" aria-label="Toggle Sidebar">
        <svg width="20" height="20" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M2 4.5C2 4.22386 2.22386 4 2.5 4H12.5C12.7761 4 13 4.22386 13 4.5C13 4.77614 12.7761 5 12.5 5H2.5C2.22386 5 2 4.77614 2 4.5ZM2 7.5C2 7.22386 2.22386 7 2.5 7H12.5C12.7761 7 13 7.22386 13 7.5C13 7.77614 12.7761 8 12.5 8H2.5C2.22386 8 2 7.77614 2 7.5ZM2 10.5C2 10.2239 2.22386 10 2.5 10H12.5C12.7761 10 13 10.2239 13 10.5C13 10.7761 12.7761 11 12.5 11H2.5C2.22386 11 2 10.7761 2 10.5Z" fill="currentColor"></path>
        </svg>
      </button>
    </div>
    <nav class="sidebar-nav">
      <ul class="nav-list">
        <li class="nav-item ${window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('/') ? 'active' : ''}">
          <a href="index.html" class="nav-link">
            <svg width="20" height="20" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7.07926 0.222253C7.31275 -0.007434 7.6873 -0.007434 7.92079 0.222253L14.6708 6.86227C14.907 7.09465 14.9101 7.47453 14.6778 7.71076C14.4454 7.947 14.0655 7.95012 13.8293 7.71773L13 6.90201V12.5C13 12.7761 12.7762 13 12.5 13H2.50002C2.22388 13 2.00002 12.7761 2.00002 12.5V6.90201L1.17079 7.71773C0.934558 7.95012 0.554672 7.947 0.32229 7.71076C0.0899079 7.47453 0.0930283 7.09465 0.32926 6.86227L7.07926 0.222253ZM7.50002 1.49163L12 5.91831V12H10V8.49999C10 8.22385 9.77617 7.99999 9.50002 7.99999H5.50002C5.22388 7.99999 5.00002 8.22385 5.00002 8.49999V12H3.00002V5.91831L7.50002 1.49163ZM6.00002 12V8.99999H9.00002V12H6.00002Z" fill="currentColor"></path></svg>
            <span>Hub</span>
          </a>
        </li>
        <li class="nav-item ${window.location.pathname.includes('timeline.html') ? 'active' : ''}">
          <a href="timeline.html" class="nav-link">
            <svg width="20" height="20" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M0.877075 7.49988C0.877075 3.84219 3.84222 0.877045 7.49991 0.877045C11.1576 0.877045 14.1227 3.84219 14.1227 7.49988C14.1227 11.1575 11.1576 14.1227 7.49991 14.1227C3.84222 14.1227 0.877075 11.1575 0.877075 7.49988ZM7.49991 1.82704C4.36689 1.82704 1.82708 4.36686 1.82708 7.49988C1.82708 10.6329 4.36689 13.1727 7.49991 13.1727C10.6329 13.1727 13.1727 10.6329 13.1727 7.49988C13.1727 4.36686 10.6329 1.82704 7.49991 1.82704ZM8.24993 4.49999C8.24993 4.9142 7.91413 5.24999 7.49993 5.24999C7.08573 5.24999 6.74993 4.9142 6.74993 4.49999C6.74993 4.08579 7.08573 3.74999 7.49993 3.74999C7.91413 3.74999 8.24993 4.08579 8.24993 4.49999ZM6.00003 5.99999H6.74003L6.74003 10.5H8.25003V10.5H6.00003V5.99999Z" fill="currentColor"></path></svg>
            <span>Timeline</span>
          </a>
        </li>
        <li class="nav-item ${window.location.pathname.includes('dynamics.html') ? 'active' : ''}">
          <a href="dynamics.html" class="nav-link">
            <svg width="20" height="20" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 1.5C1 1.22386 1.22386 1 1.5 1H5.5C5.77614 1 6 1.22386 6 1.5V5.5C6 5.77614 5.77614 6 5.5 6H1.5C1.22386 6 1 5.77614 1 5.5V1.5ZM2 2V5H5V2H2ZM9 1.5C9 1.22386 9.22386 1 9.5 1H13.5C13.7761 1 14 1.22386 14 1.5V5.5C14 5.77614 13.7761 6 13.5 6H9.5C9.22386 6 9 5.77614 9 5.5V1.5ZM10 2V5H13V2H10ZM1 9.5C1 9.22386 1.22386 9 1.5 9H5.5C5.77614 9 6 9.22386 6 9.5V13.5C6 13.7761 5.77614 14 5.5 14H1.5C1.22386 14 1 13.7761 1 13.5V9.5ZM2 10V13H5V10H2ZM9 9.5C9 9.22386 9.22386 9 9.5 9H13.5C13.7761 9 14 9.22386 14 9.5V13.5C14 13.7761 13.7761 14 13.5 14H9.5C9.22386 14 9 13.7761 9 13.5V9.5ZM10 10V13H13V10H10Z" fill="currentColor"></path></svg>
            <span>Dynamics</span>
          </a>
        </li>
        <li class="nav-item ${window.location.pathname.includes('profiles.html') ? 'active' : ''}">
          <a href="profiles.html" class="nav-link">
            <svg width="20" height="20" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7.5 0.875C5.49797 0.875 3.875 2.49797 3.875 4.5C3.875 6.15288 4.98124 7.54738 6.49373 7.98351C5.2997 8.12901 4.27557 8.55134 3.50407 9.31167C2.52216 10.2794 2.02502 11.72 2.02502 13.5999C2.02502 13.8623 2.23769 14.0749 2.50002 14.0749C2.76236 14.0749 2.97502 13.8623 2.97502 13.5999C2.97502 11.8799 3.42786 10.7206 4.17091 9.9883C4.91536 9.25463 6.02674 8.87499 7.49995 8.87499C8.97317 8.87499 10.0846 9.25463 10.8291 9.98831C11.5721 10.7206 12.025 11.8799 12.025 13.5999C12.025 13.8623 12.2376 14.0749 12.5 14.0749C12.7623 14.0749 12.975 13.8623 12.975 13.5999C12.975 11.72 12.4779 10.2794 11.4959 9.31166C10.7244 8.55135 9.70025 8.12903 8.50625 7.98352C10.0187 7.5474 11.125 6.15289 11.125 4.5C11.125 2.49797 9.50203 0.875 7.5 0.875ZM4.825 4.5C4.825 3.02264 6.02264 1.825 7.5 1.825C8.97736 1.825 10.175 3.02264 10.175 4.5C10.175 5.97736 8.97736 7.175 7.5 7.175C6.02264 7.175 4.825 5.97736 4.825 4.5Z" fill="currentColor"></path></svg>
            <span>Profiles</span>
          </a>
        </li>
      <li class="nav-item ${window.location.pathname.includes('integration.html') ? 'active' : ''}">
        <a href="integration.html" class="nav-link">
          <svg width="20" height="20" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7.14645 2.14645C7.34171 1.95118 7.65829 1.95118 7.85355 2.14645L11.8536 6.14645C12.0488 6.34171 12.0488 6.65829 11.8536 6.85355C11.6583 7.04882 11.3417 7.04882 11.1464 6.85355L8 3.70711L8 12.5C8 12.7761 7.77614 13 7.5 13C7.22386 13 7 12.7761 7 12.5L7 3.70711L3.85355 6.85355C3.65829 7.04882 3.34171 7.04882 3.14645 6.85355C2.95118 6.65829 2.95118 6.34171 3.14645 6.14645L7.14645 2.14645Z" fill="currentColor"></path></svg>
          <span>Integration</span>
        </a>
      </li>
      <li class="nav-item ${window.location.pathname.includes('network.html') ? 'active' : ''}">
        <a href="network.html" class="nav-link">
          <svg width="20" height="20" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="7.5" cy="2.5" r="1.5" fill="currentColor"/><circle cx="7.5" cy="12.5" r="1.5" fill="currentColor"/><circle cx="2.5" cy="7.5" r="1.5" fill="currentColor"/><circle cx="12.5" cy="7.5" r="1.5" fill="currentColor"/><path d="M7.5 4v6M4 7.5h7" stroke="currentColor"/></svg>
          <span>Network</span>
        </a>
      </li>
      </li>
      </ul>
    </nav>
    <div class="sidebar-footer">
      <button class="theme-toggle" aria-label="Toggle dark theme">
        <svg class="sun-icon" width="20" height="20" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7.5 0C7.77614 0 8 0.223858 8 0.5V2.5C8 2.77614 7.77614 3 7.5 3C7.22386 3 7 2.77614 7 2.5V0.5C7 0.223858 7.22386 0 7.5 0ZM2.1967 2.1967C2.39196 2.00144 2.70854 2.00144 2.90381 2.1967L4.31802 3.61091C4.51328 3.80617 4.51328 4.12276 4.31802 4.31802C4.12276 4.51328 3.80617 4.51328 3.61091 4.31802L2.1967 2.90381C2.00144 2.70854 2.00144 2.39196 2.1967 2.1967ZM0 7.5C0 7.22386 0.223858 7 0.5 7H2.5C2.77614 7 3 7.22386 3 7.5C3 7.77614 2.77614 8 2.5 8H0.5C0.223858 8 0 7.77614 0 7.5ZM2.1967 12.8033C2.00144 12.608 2.00144 12.2915 2.1967 12.0962L3.61091 10.682C3.80617 10.4867 4.12276 10.4867 4.31802 10.682C4.51328 10.8772 4.51328 11.1938 4.31802 11.3891L2.90381 12.8033C2.70854 12.9986 2.39196 12.9986 2.1967 12.8033ZM12.5 7C12.2239 7 12 7.22386 12 7.5C12 7.77614 12.2239 8 12.5 8H14.5C14.7761 8 15 7.77614 15 7.5C15 7.22386 14.7761 7 14.5 7H12.5ZM10.682 4.31802C10.4867 4.12276 10.4867 3.80617 10.682 3.61091L12.0962 2.1967C12.2915 2.00144 12.608 2.00144 12.8033 2.1967C12.9986 2.39196 12.9986 2.70854 12.8033 2.90381L11.3891 4.31802C11.1938 4.51328 10.8772 4.51328 10.682 4.31802ZM8 12.5C8 12.2239 7.77614 12 7.5 12C7.22386 12 7 12.2239 7 12.5V14.5C7 14.7761 7.22386 15 7.5 15C7.77614 15 8 14.7761 8 14.5V12.5ZM10.682 10.682C10.8772 10.4867 11.1938 10.4867 11.3891 10.682L12.8033 12.0962C12.9986 12.2915 12.9986 12.608 12.8033 12.8033C12.608 12.9986 12.2915 12.9986 12.0962 12.8033L10.682 11.3891C10.4867 11.1938 10.4867 10.8772 10.682 10.682ZM5.5 7.5C5.5 6.39543 6.39543 5.5 7.5 5.5C8.60457 5.5 9.5 6.39543 9.5 7.5C9.5 8.60457 8.60457 9.5 7.5 9.5C6.39543 9.5 5.5 8.60457 5.5 7.5ZM7.5 4.5C5.84315 4.5 4.5 5.84315 4.5 7.5C4.5 9.15685 5.84315 10.5 7.5 10.5C9.15685 10.5 10.5 9.15685 10.5 7.5C10.5 5.84315 9.15685 4.5 7.5 4.5Z" fill="currentColor"></path></svg>
        <svg class="moon-icon" width="20" height="20" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2.89998 0.499976C2.89998 0.279062 2.72089 0.0999756 2.49998 0.0999756C2.27906 0.0999756 2.09998 0.279062 2.09998 0.499976V1.09998H1.49998C1.27906 1.09998 1.09998 1.27906 1.09998 1.49998C1.09998 1.72089 1.27906 1.89998 1.49998 1.89998H2.09998V2.49998C2.09998 2.72089 2.27906 2.89998 2.49998 2.89998C2.72089 2.89998 2.89998 2.72089 2.89998 2.49998V1.89998H3.49998C3.72089 1.89998 3.89998 1.72089 3.89998 1.49998C3.89998 1.27906 3.72089 1.09998 3.49998 1.09998H2.89998V0.499976ZM5.89998 3.49998C5.89998 3.27906 5.72089 3.09998 5.49998 3.09998C5.27906 3.09998 5.09998 3.27906 5.09998 3.49998V4.09998H4.49998C4.27906 4.09998 4.09998 4.27906 4.09998 4.49998C4.09998 4.72089 4.27906 4.89998 4.49998 4.89998H5.09998V5.49998C5.09998 5.72089 5.27906 5.89998 5.49998 5.89998C5.72089 5.89998 5.89998 5.72089 5.89998 5.49998V4.89998H6.49998C6.72089 4.89998 6.89998 4.72089 6.89998 4.49998C6.89998 4.27906 6.72089 4.09998 6.49998 4.09998H5.89998V3.49998ZM1.89998 6.49998C1.89998 6.27906 1.72089 6.09998 1.49998 6.09998C1.27906 6.09998 1.09998 6.27906 1.09998 6.49998V7.09998H0.499976C0.279062 7.09998 0.0999756 7.27906 0.0999756 7.49998C0.0999756 7.72089 0.279062 7.89998 0.499976 7.89998H1.09998V8.49998C1.09998 8.72089 1.27906 8.89997 1.49998 8.89997C1.72089 8.89997 1.89998 8.72089 1.89998 8.49998V7.89998H2.49998C2.72089 7.89998 2.89998 7.72089 2.89998 7.49998C2.89998 7.27906 2.72089 7.09998 2.49998 7.09998H1.89998V6.49998ZM8.54406 0.98184L8.24618 0.941586C8.03275 0.917676 7.90692 1.1655 8.02936 1.34194C8.17013 1.54479 8.29981 1.75592 8.41754 1.97445C8.91878 2.90485 9.20322 3.96932 9.20322 5.10022C9.20322 8.37201 6.77501 11.0002 3.76432 11.0002C3.46573 11.0002 3.17246 10.9779 2.88583 10.9346C2.66434 10.9021 2.49953 11.1657 2.66121 11.3369C4.45456 13.2141 6.91572 14.5002 9.70216 14.5002C12.5271 14.5002 15.0072 13.1268 16.7929 11.1318C16.9526 10.9631 16.7936 10.7027 16.5756 10.7329C16.2726 10.7752 15.9659 10.7971 15.6538 10.7971C12.8295 10.7971 10.5346 8.50221 10.5346 5.67778C10.5346 3.95889 11.5015 2.45559 12.9367 1.69957C13.1557 1.58994 13.1101 1.29293 12.8642 1.25577L12.5243 1.20199C10.881 0.976195 9.21492 1.0469 7.63604 1.3284C7.89206 1.50472 8.12772 1.70972 8.33898 1.93719C8.3991 2.00398 8.45728 2.07127 8.51349 2.13902C8.72786 1.7518 8.80334 1.22237 8.54406 0.98184ZM8.10228 1.56371C8.10228 1.56371 8.10195 1.56397 8.10119 1.56448C8.10195 1.56396 8.10228 1.5637 8.10228 1.56371Z" fill="currentColor"></path></svg>
      </button>
    </div>
  `;
  
  document.body.prepend(sidebar);
  
  // Create content wrapper for page transitions
  const content = document.querySelector('.container');
  if (content) {
    const wrapper = document.createElement('div');
    wrapper.className = 'content-wrapper';
    content.parentNode.insertBefore(wrapper, content);
    wrapper.appendChild(content);
  }
  
  // Add event listeners
  const sidebarToggle = sidebar.querySelector('.sidebar-toggle');
  if (sidebarToggle) {
    sidebarToggle.addEventListener('click', toggleSidebar);
  }
  
  // Add theme toggle handler
  const themeToggle = sidebar.querySelector('.theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
  }
}

// Toggle sidebar open/closed
function toggleSidebar() {
  const sidebar = document.querySelector('.sidebar');
  if (sidebar) {
    sidebar.classList.toggle('collapsed');
    
    // Also adjust the content wrapper
    const wrapper = document.querySelector('.content-wrapper');
    if (wrapper) {
      wrapper.classList.toggle('sidebar-open', !sidebar.classList.contains('collapsed'));
    }
  }
}

// Setup theme toggle
function setupThemeToggle() {
  // Check for saved theme preference or system preference
  const savedTheme = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
    document.documentElement.classList.add('dark');
  }
  
  // Force update CSS display properties for icons based on current theme
  const isDark = document.documentElement.classList.contains('dark');
  for (const el of document.querySelectorAll('.sun-icon')) {
    el.style.display = isDark ? 'block' : 'none';
  }
  for (const el of document.querySelectorAll('.moon-icon')) {
    el.style.display = isDark ? 'none' : 'block';
  }
}

// Toggle between light and dark theme
function toggleTheme() {
  const isDark = document.documentElement.classList.toggle('dark');
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
  
  // Explicitly update visibility of theme icons
  for (const el of document.querySelectorAll('.sun-icon')) {
    el.style.display = isDark ? 'block' : 'none';
  }
  for (const el of document.querySelectorAll('.moon-icon')) {
    el.style.display = isDark ? 'none' : 'block';
  }
}

// Setup smooth page transitions
function setupPageTransitions() {
  // Add page transition classes
  document.body.classList.add('page-transition');
  
  // Listen for link clicks that should be transitioned
  document.addEventListener('click', e => {
    const link = e.target.closest('a');
    if (!link) return;
    
    // Only handle internal links to our visualization pages
    if (link.hostname === window.location.hostname && 
        (link.pathname.endsWith('.html') || link.pathname.endsWith('/'))) {
      e.preventDefault();
      
      // Cache the link's href for later use
      const href = link.href;
      
      // Start exit animation with higher opacity transition
      document.body.classList.add('page-exit');
      
      // After animation completes, navigate to new page
      setTimeout(() => {
        window.location = href; // Use the cached href
      }, 500); // Increase timeout for smoother transition
    }
  });
  
  // Add entrance animation - adjust timing to ensure it runs after page load
  window.addEventListener('DOMContentLoaded', () => {
    requestAnimationFrame(() => {
      document.body.classList.remove('page-exit');
      document.body.classList.add('page-enter');
      
      setTimeout(() => {
        document.body.classList.remove('page-enter');
      }, 500);
    });
  });
  
  // Also handle back/forward navigation
  window.addEventListener('pageshow', (event) => {
    if (event.persisted) { // Page is loaded from cache (back/forward)
      document.body.classList.remove('page-exit');
      document.body.classList.add('page-enter');
      
      setTimeout(() => {
        document.body.classList.remove('page-enter');
      }, 500);
    }
  });
}

// Handle initial sidebar state
function handleInitialSidebarState() {
  // Start with sidebar expanded on larger screens
  const isMobile = window.innerWidth < 768;
  const sidebar = document.querySelector('.sidebar');
  
  if (sidebar && !isMobile) {
    sidebar.classList.remove('collapsed');
    
    const wrapper = document.querySelector('.content-wrapper');
    if (wrapper) {
      wrapper.classList.add('sidebar-open');
    }
  }
  
  // Handle resize events
  window.addEventListener('resize', () => {
    const isMobile = window.innerWidth < 768;
    
    if (isMobile && sidebar) {
      sidebar.classList.add('collapsed');
      
      const wrapper = document.querySelector('.content-wrapper');
      if (wrapper) {
        wrapper.classList.remove('sidebar-open');
      }
    }
  });
}
