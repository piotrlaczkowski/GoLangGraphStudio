/* Custom JavaScript for GoLangGraph Studio documentation */

document.addEventListener('DOMContentLoaded', function() {
  // Add copy button to code blocks
  const codeBlocks = document.querySelectorAll('pre code');
  codeBlocks.forEach(function(codeBlock) {
    const pre = codeBlock.parentNode;
    if (!pre.querySelector('.copy-button')) {
      const copyButton = document.createElement('button');
      copyButton.className = 'copy-button';
      copyButton.innerHTML = '📋';
      copyButton.title = 'Copy to clipboard';
      copyButton.addEventListener('click', function() {
        navigator.clipboard.writeText(codeBlock.textContent).then(function() {
          copyButton.innerHTML = '✅';
          setTimeout(function() {
            copyButton.innerHTML = '📋';
          }, 2000);
        });
      });
      pre.style.position = 'relative';
      pre.appendChild(copyButton);
    }
  });

  // Add fade-in animation to images
  const images = document.querySelectorAll('img');
  const imageObserver = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('fade-in-up');
      }
    });
  });

  images.forEach(function(img) {
    imageObserver.observe(img);
  });

  // Add smooth scrolling to anchor links
  const anchorLinks = document.querySelectorAll('a[href^="#"]');
  anchorLinks.forEach(function(link) {
    link.addEventListener('click', function(e) {
      const targetId = this.getAttribute('href').substring(1);
      const targetElement = document.getElementById(targetId);
      if (targetElement) {
        e.preventDefault();
        targetElement.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });

  // Add external link indicators
  const externalLinks = document.querySelectorAll('a[href^="http"]:not([href*="' + window.location.hostname + '"])');
  externalLinks.forEach(function(link) {
    if (!link.querySelector('.external-icon')) {
      const icon = document.createElement('span');
      icon.className = 'external-icon';
      icon.innerHTML = ' ↗';
      icon.style.fontSize = '0.8em';
      icon.style.opacity = '0.7';
      link.appendChild(icon);
    }
  });

  // Add keyboard navigation
  document.addEventListener('keydown', function(e) {
    // Ctrl/Cmd + K to focus search
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      const searchInput = document.querySelector('.md-search__input');
      if (searchInput) {
        searchInput.focus();
      }
    }
    
    // Escape to close search
    if (e.key === 'Escape') {
      const searchInput = document.querySelector('.md-search__input');
      if (searchInput && document.activeElement === searchInput) {
        searchInput.blur();
      }
    }
  });

  // Add table of contents highlighting
  const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
  const tocLinks = document.querySelectorAll('.md-nav--secondary a');
  
  const headingObserver = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        // Remove active class from all TOC links
        tocLinks.forEach(function(link) {
          link.classList.remove('active');
        });
        
        // Add active class to corresponding TOC link
        const id = entry.target.id;
        if (id) {
          const correspondingLink = document.querySelector('.md-nav--secondary a[href="#' + id + '"]');
          if (correspondingLink) {
            correspondingLink.classList.add('active');
          }
        }
      }
    });
  }, {
    rootMargin: '-20% 0px -70% 0px'
  });

  headings.forEach(function(heading) {
    headingObserver.observe(heading);
  });

  // Add click tracking for analytics (if needed)
  const trackableElements = document.querySelectorAll('[data-track]');
  trackableElements.forEach(function(element) {
    element.addEventListener('click', function() {
      const action = this.getAttribute('data-track');
      // Add your analytics tracking code here
      console.log('Tracked action:', action);
    });
  });

  // Add image zoom functionality
  const zoomableImages = document.querySelectorAll('.image-container img, .hero img');
  zoomableImages.forEach(function(img) {
    img.style.cursor = 'zoom-in';
    img.addEventListener('click', function() {
      // Create modal overlay
      const overlay = document.createElement('div');
      overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 9999;
        cursor: zoom-out;
      `;
      
      // Create zoomed image
      const zoomedImg = document.createElement('img');
      zoomedImg.src = this.src;
      zoomedImg.alt = this.alt;
      zoomedImg.style.cssText = `
        max-width: 90%;
        max-height: 90%;
        object-fit: contain;
        border-radius: 8px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      `;
      
      overlay.appendChild(zoomedImg);
      document.body.appendChild(overlay);
      
      // Close on click
      overlay.addEventListener('click', function() {
        document.body.removeChild(overlay);
      });
      
      // Close on escape key
      const escapeHandler = function(e) {
        if (e.key === 'Escape') {
          document.body.removeChild(overlay);
          document.removeEventListener('keydown', escapeHandler);
        }
      };
      document.addEventListener('keydown', escapeHandler);
    });
  });

  // Add progress indicator for long pages
  const progressBar = document.createElement('div');
  progressBar.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 0;
    height: 3px;
    background: var(--md-primary-fg-color, #2196F3);
    z-index: 9999;
    transition: width 0.3s ease;
  `;
  document.body.appendChild(progressBar);

  window.addEventListener('scroll', function() {
    const scrollTop = window.pageYOffset;
    const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercent = (scrollTop / documentHeight) * 100;
    progressBar.style.width = scrollPercent + '%';
  });

  // Add back to top button
  const backToTop = document.createElement('button');
  backToTop.innerHTML = '↑';
  backToTop.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 50px;
    height: 50px;
    border-radius: 50%;
    background: var(--md-primary-fg-color, #2196F3);
    color: white;
    border: none;
    font-size: 20px;
    cursor: pointer;
    opacity: 0;
    transition: opacity 0.3s ease;
    z-index: 1000;
  `;
  
  backToTop.addEventListener('click', function() {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });
  
  document.body.appendChild(backToTop);

  window.addEventListener('scroll', function() {
    if (window.pageYOffset > 300) {
      backToTop.style.opacity = '1';
    } else {
      backToTop.style.opacity = '0';
    }
  });
});

// Add CSS for copy button
const style = document.createElement('style');
style.textContent = `
  .copy-button {
    position: absolute;
    top: 8px;
    right: 8px;
    background: rgba(255, 255, 255, 0.1);
    border: none;
    border-radius: 4px;
    padding: 4px 8px;
    cursor: pointer;
    font-size: 14px;
    opacity: 0.7;
    transition: opacity 0.2s;
  }
  
  .copy-button:hover {
    opacity: 1;
    background: rgba(255, 255, 255, 0.2);
  }
  
  pre:hover .copy-button {
    opacity: 1;
  }
  
  .md-nav--secondary a.active {
    color: var(--md-primary-fg-color) !important;
    font-weight: 600;
  }
`;
document.head.appendChild(style); 