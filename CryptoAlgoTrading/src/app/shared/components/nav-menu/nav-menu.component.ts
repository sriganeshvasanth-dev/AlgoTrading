import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-nav-menu',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './nav-menu.component.html',
  encapsulation: ViewEncapsulation.None,
  styles: [`
    :host {
      --nav-bg: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      --nav-text: white;
      display: block;
    }

    .navbar {
      background: var(--nav-bg);
      padding: 0;
      margin: 0;
      position: sticky;
      top: 0;
      z-index: 1000;
      width: 100%;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .nav-container {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.5rem;
      max-width: 1400px;
      margin: 0 auto;
      position: relative;
      width: 100%;
      height: 64px;
    }

    .nav-brand {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
      flex-shrink: 0;
      text-decoration: none;
      color: white;
    }

    .brand-icon {
      font-size: 1.5rem;
      display: flex;
      align-items: center;
    }

    .brand-text {
      font-size: 1.25rem;
      font-weight: bold;
      color: white;
      letter-spacing: 0.5px;
    }

    /* Hamburger Menu Button */
    .menu-toggle {
      background: none;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0.5rem;
      margin-left: auto;
      z-index: 1001;
    }

    .hamburger {
      width: 1.75rem;
      height: 1.25rem;
      display: flex;
      flex-direction: column;
      justify-content: space-around;
      position: relative;
      transition: all 0.3s ease;
    }

    .hamburger span {
      height: 0.25rem;
      background-color: white;
      border-radius: 0.125rem;
      transition: all 0.3s ease;
      display: block;
      width: 100%;
    }

    .hamburger.active span:nth-child(1) {
      transform: rotate(45deg) translate(0.65rem, 0.65rem);
    }

    .hamburger.active span:nth-child(2) {
      opacity: 0;
    }

    .hamburger.active span:nth-child(3) {
      transform: rotate(-45deg) translate(0.35rem, -0.35rem);
    }

    /* Dropdown Menu */
    .menu-dropdown {
      position: fixed;
      top: 4rem;
      right: 0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-width: 250px;
      max-width: 300px;
      border-radius: 0 0 0.5rem 0.5rem;
      box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
      max-height: calc(100vh - 4rem);
      overflow-y: auto;
      transform: translateY(-20px);
      opacity: 0;
      pointer-events: none;
      transition: all 0.3s ease;
      z-index: 1000;
    }

    .menu-dropdown.active {
      transform: translateY(0);
      opacity: 1;
      pointer-events: auto;
    }

    .nav-menu {
      list-style: none;
      margin: 0;
      padding: 0;
    }

    .nav-item {
      margin: 0;
      padding: 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    .nav-item:last-child {
      border-bottom: none;
    }

    .nav-link {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1rem 1.5rem;
      color: white;
      text-decoration: none;
      transition: background-color 0.3s ease;
      cursor: pointer;
    }

    .nav-link:hover {
      background-color: rgba(255, 255, 255, 0.15);
    }

    .nav-link.active {
      background-color: rgba(255, 255, 255, 0.25);
      font-weight: 600;
    }

    .nav-icon {
      font-size: 1.25rem;
      display: flex;
      align-items: center;
      flex-shrink: 0;
    }

    .nav-text {
      flex-grow: 1;
    }

    /* Config Item Styling */
    .config-item {
      padding: 0.5rem 1.5rem;
    }

    .config-item :deep(app-config) {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      color: white;
      text-decoration: none;
      width: 100%;
    }

    .config-item :deep(button) {
      background: none;
      border: none;
      color: white;
      padding: 0.5rem 0;
      cursor: pointer;
      transition: background-color 0.3s ease;
      width: 100%;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      font-size: 1rem;
    }

    .config-item :deep(button):hover {
      background-color: rgba(255, 255, 255, 0.15);
      border-radius: 0.25rem;
    }

    /* Theme Toggle */
    .theme-item {
      padding: 0.5rem 1.5rem;
      border-top: 1px solid rgba(255, 255, 255, 0.2);
    }

    .theme-toggle {
      background: none;
      border: none;
      color: white;
      font-size: 1.25rem;
      cursor: pointer;
      padding: 0.75rem;
      width: 100%;
      text-align: center;
      transition: background-color 0.3s ease;
      border-radius: 0.25rem;
    }

    .theme-toggle:hover {
      background-color: rgba(255, 255, 255, 0.15);
    }

    /* Overlay */
    .menu-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.3);
      z-index: 999;
      animation: fadeIn 0.3s ease;
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }

    /* Responsive Design */
    @media (max-width: 768px) {
      .nav-container {
        padding: 0.75rem 1rem;
      }

      .brand-text {
        font-size: 1rem;
      }

      .menu-dropdown {
        min-width: 220px;
        max-width: 280px;
      }

      .nav-link {
        padding: 0.75rem 1.25rem;
      }

      .nav-icon {
        font-size: 1.1rem;
      }
    }

    @media (max-width: 480px) {
      .nav-container {
        padding: 0.5rem 0.75rem;
      }

      .brand-icon {
        font-size: 1.25rem;
      }

      .brand-text {
        font-size: 0.9rem;
      }

      .menu-dropdown {
        min-width: 200px;
        max-width: 100vw;
        right: 0;
      }

      .nav-link {
        padding: 0.6rem 1rem;
        font-size: 0.95rem;
      }

      .nav-icon {
        font-size: 1rem;
      }
    }

    /* Dark Theme Adjustments */
    :host-context([data-theme="dark"]) .navbar {
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
    }

    :host-context([data-theme="dark"]) .menu-dropdown {
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      box-shadow: 0 8px 16px rgba(0, 0, 0, 0.5);
    }

    :host-context([data-theme="dark"]) .nav-link:hover {
      background-color: rgba(255, 255, 255, 0.1);
    }

    :host-context([data-theme="dark"]) .nav-link.active {
      background-color: rgba(102, 126, 234, 0.3);
    }

    :host-context([data-theme="dark"]) .menu-overlay {
      background-color: rgba(0, 0, 0, 0.6);
    }
  `]
})
export class NavMenuComponent implements OnInit {
  isDarkTheme = false;
  isMenuOpen = false;

  ngOnInit(): void {
    // Load theme preference from localStorage
    const savedTheme = localStorage.getItem('theme');
    this.isDarkTheme = savedTheme === 'dark';
    this.applyTheme();
  }

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  closeMenu(): void {
    this.isMenuOpen = false;
  }

  toggleTheme(): void {
    this.isDarkTheme = !this.isDarkTheme;
    this.applyTheme();
    localStorage.setItem('theme', this.isDarkTheme ? 'dark' : 'light');
  }

  private applyTheme(): void {
    if (this.isDarkTheme) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
    }
  }
}
