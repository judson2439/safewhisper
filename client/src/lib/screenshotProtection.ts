// Advanced screenshot protection utilities
export class ScreenshotProtection {
  private static instance: ScreenshotProtection;
  private observers: MutationObserver[] = [];
  private isActive = false;

  static getInstance(): ScreenshotProtection {
    if (!ScreenshotProtection.instance) {
      ScreenshotProtection.instance = new ScreenshotProtection();
    }
    return ScreenshotProtection.instance;
  }

  enable(): void {
    if (this.isActive) return;
    this.isActive = true;

    // Disable right-click context menu
    this.disableContextMenu();
    
    // Disable common screenshot shortcuts
    this.disableScreenshotShortcuts();
    
    // Monitor for developer tools
    this.monitorDevTools();
    
    // Add visual protection layers
    this.addVisualProtection();
    
    // Disable print functionality
    this.disablePrint();
    
    // Monitor for clipboard access
    this.monitorClipboard();
  }

  disable(): void {
    if (!this.isActive) return;
    this.isActive = false;
    
    // Clean up observers
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    
    // Remove event listeners
    document.removeEventListener('contextmenu', this.preventContextMenu);
    document.removeEventListener('keydown', this.preventScreenshotKeys);
    window.removeEventListener('beforeprint', this.preventPrint);
  }

  private disableContextMenu(): void {
    document.addEventListener('contextmenu', this.preventContextMenu, { passive: false });
  }

  private preventContextMenu = (e: Event): boolean => {
    e.preventDefault();
    e.stopPropagation();
    return false;
  };

  private disableScreenshotShortcuts(): void {
    document.addEventListener('keydown', this.preventScreenshotKeys, { passive: false });
  }

  private preventScreenshotKeys = (e: KeyboardEvent): void => {
    // Prevent common screenshot shortcuts
    const forbiddenKeys = [
      // PrintScreen
      { key: 'PrintScreen' },
      // Windows + Shift + S (Snipping Tool)
      { key: 'S', ctrl: false, shift: true, meta: true },
      // Ctrl + Shift + I (DevTools)
      { key: 'I', ctrl: true, shift: true, meta: false },
      // F12 (DevTools)
      { key: 'F12' },
      // Ctrl + U (View Source)
      { key: 'U', ctrl: true, shift: false, meta: false },
      // Ctrl + Shift + C (Inspect Element)
      { key: 'C', ctrl: true, shift: true, meta: false },
      // Ctrl + Shift + J (Console)
      { key: 'J', ctrl: true, shift: true, meta: false },
    ];

    for (const forbidden of forbiddenKeys) {
      if (
        e.key === forbidden.key &&
        (forbidden.ctrl === undefined || e.ctrlKey === forbidden.ctrl) &&
        (forbidden.shift === undefined || e.shiftKey === forbidden.shift) &&
        (forbidden.meta === undefined || e.metaKey === forbidden.meta)
      ) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
    }
  };

  private monitorDevTools(): void {
    // Detect DevTools opening
    let devtools = { open: false };
    const threshold = 160;

    setInterval(() => {
      if (
        window.outerHeight - window.innerHeight > threshold ||
        window.outerWidth - window.innerWidth > threshold
      ) {
        if (!devtools.open) {
          devtools.open = true;
          this.handleDevToolsOpen();
        }
      } else {
        devtools.open = false;
      }
    }, 1000);
  }

  private handleDevToolsOpen(): void {
    // Blur sensitive content when DevTools detected
    document.body.style.filter = 'blur(10px)';
    
    // Show warning
    const warning = document.createElement('div');
    warning.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(0, 0, 0, 0.9);
      color: white;
      padding: 20px;
      border-radius: 10px;
      z-index: 99999;
      text-align: center;
      font-size: 18px;
    `;
    warning.textContent = '⚠️ Security Alert: Developer tools detected. Content hidden for privacy.';
    document.body.appendChild(warning);
    
    setTimeout(() => {
      if (document.body.contains(warning)) {
        document.body.removeChild(warning);
        document.body.style.filter = '';
      }
    }, 3000);
  }

  private addVisualProtection(): void {
    // Add dynamic watermarks
    const watermark = document.createElement('div');
    watermark.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 9997;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Ctext x='50' y='50' font-family='Arial' font-size='12' fill='%23000000' fill-opacity='0.03' text-anchor='middle' dominant-baseline='middle' transform='rotate(-45 50 50)'%3ESECURE%3C/text%3E%3C/svg%3E");
      background-repeat: repeat;
      animation: watermarkMove 20s linear infinite;
    `;
    document.body.appendChild(watermark);
  }

  private disablePrint(): void {
    window.addEventListener('beforeprint', this.preventPrint);
    
    // Override print function
    window.print = () => {
      alert('Printing is disabled for security reasons.');
    };
  }

  private preventPrint = (e: Event): void => {
    e.preventDefault();
    alert('Printing is disabled for security reasons.');
  };

  private monitorClipboard(): void {
    // Monitor clipboard access attempts
    document.addEventListener('copy', (e) => {
      // Allow copying but clear sensitive content
      setTimeout(() => {
        if (navigator.clipboard) {
          navigator.clipboard.writeText('Content protected - copying disabled');
        }
      }, 100);
    });
  }
}

// Auto-enable protection when module loads
export const enableScreenshotProtection = (): void => {
  ScreenshotProtection.getInstance().enable();
};

export const disableScreenshotProtection = (): void => {
  ScreenshotProtection.getInstance().disable();
};