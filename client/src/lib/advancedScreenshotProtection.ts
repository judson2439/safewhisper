// Comprehensive screenshot and screen capture protection
export function enableComprehensiveScreenshotProtection() {
  // Comprehensive keyboard blocking
  document.addEventListener('keydown', (e) => {
    // Block PrintScreen (multiple keys)
    if (e.keyCode === 44 || e.key === 'PrintScreen') {
      e.preventDefault();
      e.stopPropagation();
      showSecurityAlert('Screenshots are not allowed on this secure platform.');
      return false;
    }
    
    // Block F12 (DevTools)
    if (e.keyCode === 123) {
      e.preventDefault();
      e.stopPropagation();
      showSecurityAlert('Developer tools are disabled for security.');
      return false;
    }
    
    // Block Ctrl+Shift+I (Inspector)
    if (e.ctrlKey && e.shiftKey && e.keyCode === 73) {
      e.preventDefault();
      e.stopPropagation();
      showSecurityAlert('Inspector is disabled for security.');
      return false;
    }
    
    // Block Ctrl+Shift+J (Console)
    if (e.ctrlKey && e.shiftKey && e.keyCode === 74) {
      e.preventDefault();
      e.stopPropagation();
      showSecurityAlert('Console is disabled for security.');
      return false;
    }
    
    // Block Ctrl+Shift+C (Element inspector)
    if (e.ctrlKey && e.shiftKey && e.keyCode === 67) {
      e.preventDefault();
      e.stopPropagation();
      showSecurityAlert('Element inspector is disabled for security.');
      return false;
    }
    
    // Block Ctrl+U (View source)
    if (e.ctrlKey && e.keyCode === 85) {
      e.preventDefault();
      e.stopPropagation();
      showSecurityAlert('View source is disabled for security.');
      return false;
    }
    
    // Block Ctrl+S (Save page)
    if (e.ctrlKey && e.keyCode === 83) {
      e.preventDefault();
      e.stopPropagation();
      showSecurityAlert('Saving page is not allowed.');
      return false;
    }
    
    // Block Ctrl+P (Print)
    if (e.ctrlKey && e.keyCode === 80) {
      e.preventDefault();
      e.stopPropagation();
      showSecurityAlert('Printing is disabled for security.');
      return false;
    }
    
    // Block Ctrl+A (Select all)
    if (e.ctrlKey && e.keyCode === 65) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
    
    // Block Ctrl+C (Copy)
    if (e.ctrlKey && e.keyCode === 67 && !e.shiftKey) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
    
    // Block Windows Key + Shift + S (Snipping Tool)
    if (e.metaKey && e.shiftKey && e.keyCode === 83) {
      e.preventDefault();
      e.stopPropagation();
      showSecurityAlert('Screen capture tools are blocked.');
      return false;
    }
    
    // Block Alt+PrintScreen
    if (e.altKey && e.keyCode === 44) {
      e.preventDefault();
      e.stopPropagation();
      showSecurityAlert('Screenshots are not allowed.');
      return false;
    }

    // Block Cmd+Shift+3 (macOS screenshot)
    if (e.metaKey && e.shiftKey && e.keyCode === 51) {
      e.preventDefault();
      e.stopPropagation();
      showSecurityAlert('Screenshots are not allowed.');
      return false;
    }

    // Block Cmd+Shift+4 (macOS screenshot selection)
    if (e.metaKey && e.shiftKey && e.keyCode === 52) {
      e.preventDefault();
      e.stopPropagation();
      showSecurityAlert('Screenshots are not allowed.');
      return false;
    }

    // Block Cmd+Shift+5 (macOS screenshot menu)
    if (e.metaKey && e.shiftKey && e.keyCode === 53) {
      e.preventDefault();
      e.stopPropagation();
      showSecurityAlert('Screenshots are not allowed.');
      return false;
    }
  });

  // Block right-click context menu
  document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    e.stopPropagation();
    showSecurityAlert('Right-click is disabled for security.');
    return false;
  });

  // Block mouse combinations that could trigger screenshots
  document.addEventListener('mousedown', (e) => {
    // Block middle mouse button (sometimes used for screenshots)
    if (e.button === 1) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  });

  // Advanced DevTools detection
  let devtools = {
    open: false,
    orientation: null
  };
  
  const threshold = 160;
  
  setInterval(() => {
    const widthDiff = window.outerWidth - window.innerWidth;
    const heightDiff = window.outerHeight - window.innerHeight;
    
    if (heightDiff > threshold || widthDiff > threshold) {
      if (!devtools.open) {
        devtools.open = true;
        // Blur and hide content when DevTools detected
        document.body.style.filter = 'blur(20px)';
        document.body.style.opacity = '0.3';
        console.clear();
        console.log('%cDEVELOPER TOOLS DETECTED!', 
          'color: red; font-size: 30px; font-weight: bold; background: yellow;');
        console.log('%cContent has been protected for security.', 
          'color: red; font-size: 16px;');
        
        // Show overlay warning
        showDevToolsWarning();
      }
    } else {
      if (devtools.open) {
        devtools.open = false;
        document.body.style.filter = 'none';
        document.body.style.opacity = '1';
        hideDevToolsWarning();
      }
    }
  }, 300);

  // Monitor clipboard access
  document.addEventListener('copy', (e) => {
    e.preventDefault();
    e.stopPropagation();
    showSecurityAlert('Copying content is not allowed.');
    return false;
  });

  // Disable text selection globally
  document.body.style.userSelect = 'none';
  document.body.style.webkitUserSelect = 'none';
  document.body.style.mozUserSelect = 'none';
  document.body.style.msUserSelect = 'none';
  
  // Disable drag and drop
  document.addEventListener('dragstart', (e) => {
    e.preventDefault();
    e.stopPropagation();
    return false;
  });

  // Block window focus events that might indicate screen capture
  window.addEventListener('blur', () => {
    // Could indicate user switched to screenshot tool
    console.clear();
  });

  // Disable print functionality
  window.addEventListener('beforeprint', (e) => {
    e.preventDefault();
    e.stopPropagation();
    showSecurityAlert('Printing is disabled for security.');
    return false;
  });

  // Override print function
  window.print = function() {
    showSecurityAlert('Printing is disabled for security.');
  };

  // Override common screenshot keyboard shortcuts
  document.addEventListener('keyup', (e) => {
    if (e.keyCode === 44) { // PrintScreen release
      // Clear clipboard if possible
      if (navigator.clipboard) {
        navigator.clipboard.writeText('').catch(() => {});
      }
    }
  });

  // Detect window resizing that might indicate screenshot tools
  let resizeTimeout: number;
  window.addEventListener('resize', () => {
    window.clearTimeout(resizeTimeout);
    resizeTimeout = window.setTimeout(() => {
      // Check for suspicious window sizes
      const aspectRatio = window.innerWidth / window.innerHeight;
      if (aspectRatio < 0.5 || aspectRatio > 3) {
        console.clear();
        showSecurityAlert('Unusual window dimensions detected.');
      }
    }, 100);
  });

  // Monitor for external applications
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      // Page became hidden, might be screenshot tool
      console.clear();
      // Clear sensitive content when page is hidden
      setTimeout(() => {
        if (document.hidden) {
          document.body.style.opacity = '0.1';
        }
      }, 1000);
    } else {
      document.body.style.opacity = '1';
    }
  });

  // Prevent saving page
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.keyCode === 83) {
      e.preventDefault();
      showSecurityAlert('Saving page is not allowed.');
      return false;
    }
  });
}

function showSecurityAlert(message: string) {
  // Create a non-intrusive toast-like notification
  const toast = document.createElement('div');
  toast.className = 'security-toast';
  toast.textContent = `🔒 ${message}`;
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #dc2626;
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    font-weight: 600;
    z-index: 10000;
    box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);
    animation: slideIn 0.3s ease-out;
    font-family: system-ui, -apple-system, sans-serif;
  `;
  
  // Add animation styles if not already added
  if (!document.querySelector('#security-animations')) {
    const style = document.createElement('style');
    style.id = 'security-animations';
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }
  
  document.body.appendChild(toast);
  
  // Auto remove after 3 seconds
  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease-in';
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }, 3000);
}

function showDevToolsWarning() {
  if (document.getElementById('devtools-warning')) return;
  
  const warning = document.createElement('div');
  warning.id = 'devtools-warning';
  warning.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.95);
    color: white;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    z-index: 99999;
    font-family: system-ui, -apple-system, sans-serif;
  `;
  
  warning.innerHTML = `
    <div style="text-align: center; padding: 40px; max-width: 800px;">
      <h1 style="color: #ef4444; font-size: 48px; margin: 0 0 20px 0; text-shadow: 2px 2px 4px rgba(0,0,0,0.5);">⚠️ SECURITY ALERT</h1>
      <h2 style="font-size: 28px; margin: 0 0 20px 0; color: #fbbf24;">Developer Tools Detected</h2>
      <p style="font-size: 18px; margin: 0 0 30px 0; line-height: 1.6; color: #e5e7eb;">
        This secure messaging platform has detected unauthorized access attempts through developer tools. 
        Content has been protected to maintain security and privacy standards.
      </p>
      <p style="font-size: 16px; color: #94a3b8; margin-bottom: 20px;">
        Please close developer tools to continue using the application safely.
      </p>
      <div style="background: rgba(220, 38, 38, 0.2); border: 2px solid #dc2626; border-radius: 8px; padding: 15px; margin-top: 20px;">
        <p style="margin: 0; font-size: 14px; color: #fca5a5;">
          ⚠️ Unauthorized access attempts are logged and monitored for security purposes.
        </p>
      </div>
    </div>
  `;
  
  document.body.appendChild(warning);
}

function hideDevToolsWarning() {
  const warning = document.getElementById('devtools-warning');
  if (warning) {
    warning.remove();
  }
}

