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
    
    initFaqAccordion();
    
    // Initialize quantity controls
    initQuantityControls();
    
    // Initialize product sorting
    initProductSorting();
    
    // Initialize mobile menu
    initMobileMenu();
  });
  
  // Quantity control functionality
  function initQuantityControls() {
    // For all minus buttons (both in product details and cart)
    const minusButtons = document.querySelectorAll('.qty-btn.minus, .cart-qty-btn.minus');
    const plusButtons = document.querySelectorAll('.qty-btn.plus, .cart-qty-btn.plus');
    
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
    const mobileNav = document.querySelector('.mobile-nav');
    const mobileOverlay = document.querySelector('.mobile-overlay');
    
    if (mobileMenuToggle) {
      mobileMenuToggle.addEventListener('click', function() {
        document.body.classList.toggle('mobile-nav-active');
        mobileNav.classList.toggle('active');
        mobileOverlay.classList.toggle('active');
      });
      
      // Close mobile menu when clicking on overlay
      if (mobileOverlay) {
        mobileOverlay.addEventListener('click', function() {
          document.body.classList.remove('mobile-nav-active');
          mobileNav.classList.remove('active');
          mobileOverlay.classList.remove('active');
        });
      }
      
      // Mobile dropdown toggles
      const mobileDropdownToggles = document.querySelectorAll('.mobile-dropdown-toggle');
      mobileDropdownToggles.forEach(toggle => {
        toggle.addEventListener('click', function() {
          const parent = this.closest('.mobile-nav-item');
          const dropdownMenu = parent.querySelector('.mobile-dropdown-menu');
          dropdownMenu.classList.toggle('active');
          this.querySelector('i').classList.toggle('fa-chevron-down');
          this.querySelector('i').classList.toggle('fa-chevron-up');
        });
      });
    }
    
    // Close mobile menu with close button
    const mobileNavClose = document.querySelector('.mobile-nav-close');
    if (mobileNavClose) {
      mobileNavClose.addEventListener('click', function() {
        document.body.classList.remove('mobile-nav-active');
        document.querySelector('.mobile-nav').classList.remove('active');
        document.querySelector('.mobile-overlay').classList.remove('active');
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
  function initFaqAccordion() {
    const faqItems = document.querySelectorAll('.faq-item');
    
    faqItems.forEach(item => {
      const question = item.querySelector('.faq-question');
      const answer = item.querySelector('.faq-answer');
      
      if (question) {
        question.addEventListener('click', function() {
          item.classList.toggle('active');
        });
      }
    });
  }
  
  // Initialize responsive features
  window.addEventListener('load', makeTablesResponsive);
  window.addEventListener('resize', makeTablesResponsive);
