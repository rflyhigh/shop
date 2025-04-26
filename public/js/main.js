// public/js/main.js

// Close alert messages
document.addEventListener('DOMContentLoaded', function() {
    const closeButtons = document.querySelectorAll('.alert .close-btn');
    
    closeButtons.forEach(button => {
      button.addEventListener('click', function() {
        this.parentElement.style.display = 'none';
      });
    });
    
    // Auto-hide alerts after 5 seconds
    setTimeout(() => {
      const alerts = document.querySelectorAll('.alert');
      alerts.forEach(alert => {
        alert.style.display = 'none';
      });
    }, 5000);
    
    // Initialize quantity controls
    initQuantityControls();
    
    // Initialize product sorting
    initProductSorting();
    
    // Initialize mobile menu
    initMobileMenu();
  });
  
  // Quantity control functionality
  function initQuantityControls() {
    const minusButtons = document.querySelectorAll('.qty-btn.minus');
    const plusButtons = document.querySelectorAll('.qty-btn.plus');
    
    minusButtons.forEach(button => {
      button.addEventListener('click', function() {
        const input = this.parentElement.querySelector('input');
        const value = parseInt(input.value);
        if (value > 1) {
          input.value = value - 1;
        }
      });
    });
    
    plusButtons.forEach(button => {
      button.addEventListener('click', function() {
        const input = this.parentElement.querySelector('input');
        const value = parseInt(input.value);
        const max = parseInt(input.getAttribute('max') || 99);
        if (value < max) {
          input.value = value + 1;
        }
      });
    });
  }
  
  // Product sorting functionality
  function initProductSorting() {
    const sortSelect = document.getElementById('sort-products');
    
    if (sortSelect) {
      // Set initial value based on URL
      const urlParams = new URLSearchParams(window.location.search);
      const sortParam = urlParams.get('sort');
      
      if (sortParam) {
        sortSelect.value = sortParam;
      }
      
      sortSelect.addEventListener('change', function() {
        const sortBy = this.value;
        const currentUrl = new URL(window.location.href);
        currentUrl.searchParams.set('sort', sortBy);
        window.location.href = currentUrl.toString();
      });
    }
  }
  
  // Mobile menu functionality
  function initMobileMenu() {
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const mainNav = document.querySelector('.main-nav');
    
    if (mobileMenuToggle && mainNav) {
      mobileMenuToggle.addEventListener('click', function() {
        mainNav.classList.toggle('active');
        this.innerHTML = mainNav.classList.contains('active') 
          ? '<i class="fas fa-times"></i>' 
          : '<i class="fas fa-bars"></i>';
      });
      
      // Close mobile menu when clicking outside
      document.addEventListener('click', function(event) {
        if (!event.target.closest('.main-nav') && 
            !event.target.closest('.mobile-menu-toggle') && 
            mainNav.classList.contains('active')) {
          mainNav.classList.remove('active');
          mobileMenuToggle.innerHTML = '<i class="fas fa-bars"></i>';
        }
      });
    }
    
    // Handle dropdown menus on mobile
    const dropdownToggles = document.querySelectorAll('.dropdown-toggle');
    
    if (window.innerWidth <= 768) {
      dropdownToggles.forEach(toggle => {
        toggle.addEventListener('click', function(e) {
          e.preventDefault();
          const parent = this.parentElement;
          const dropdownMenu = parent.querySelector('.dropdown-menu');
          
          // Close all other dropdowns
          document.querySelectorAll('.dropdown-menu').forEach(menu => {
            if (menu !== dropdownMenu) {
              menu.style.display = 'none';
            }
          });
          
          // Toggle this dropdown
          dropdownMenu.style.display = dropdownMenu.style.display === 'block' ? 'none' : 'block';
        });
      });
    }
  }
  
  // Responsive tables
  function makeTablesResponsive() {
    const tables = document.querySelectorAll('.cart-table, .admin-table, .items-table');
    
    if (window.innerWidth <= 768) {
      tables.forEach(table => {
        if (!table.parentElement.classList.contains('admin-table-container')) {
          const wrapper = document.createElement('div');
          wrapper.className = 'admin-table-container';
          table.parentNode.insertBefore(wrapper, table);
          wrapper.appendChild(table);
        }
      });
    }
  }
  
  // Initialize responsive features
  window.addEventListener('load', makeTablesResponsive);
  window.addEventListener('resize', makeTablesResponsive);