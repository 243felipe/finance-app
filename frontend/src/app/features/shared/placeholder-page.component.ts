import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-placeholder-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="card-surface placeholder-card">
      <h2>{{ title }}</h2>
      <p>Em breve: {{ title }}.</p>
    </section>
  `,
  styles: [
    `
      .placeholder-card {
        padding: 1.5rem;
        background: #ffffff;
        border: 1px solid rgba(13, 6, 100, 0.08);
        border-radius: 16px;
        box-shadow: var(--shadow-sm, 0 10px 30px rgba(0, 0, 0, 0.05));
        color: #0d0664;
        width: min(1200px, calc(100vw - 32px));
        margin: 0 auto;
      }
      h2 {
        margin: 0 0 0.5rem;
      }
    `
  ]
})
export class PlaceholderPageComponent {
  @Input() title = 'Página';
}
