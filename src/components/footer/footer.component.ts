import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <footer class="footer">
      <div class="footer-content">
        <p>&copy; 2025 AI Job Searcher. All rights reserved.</p>
        <div class="footer-links">
        
        </div>
      </div>
    </footer>
  `,
  styles: [`
    .footer {
      background: var(--card-background);
      border-top: 1px solid var(--border-color);
      padding: 1rem 2rem;
    }
    
    .footer-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      max-width: 1200px;
      margin: 0 auto;
    }
    
    .footer-content p {
      margin: 0;
      color: var(--text-secondary);
      font-size: 0.9rem;
    }
    
    .footer-links {
      display: flex;
      gap: 1.5rem;
    }
    
    .footer-links a {
      color: var(--text-secondary);
      text-decoration: none;
      font-size: 0.9rem;
      transition: color 0.3s ease;
    }
    
    .footer-links a:hover {
      color: var(--primary-color);
    }
    
    @media (max-width: 768px) {
      .footer-content {
        flex-direction: column;
        gap: 1rem;
        text-align: center;
      }
    }
  `]
})
export class FooterComponent {} 