import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-verificacao-estoque',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="estoque-page">
      <h1>Verificação de Quantidade</h1>
      <p>Em breve: consulta à view de estoque atual por produto.</p>
    </section>
  `,
  styles: [`
    .estoque-page {
      padding: 1.5rem;
    }
    h1 {
      margin: 0 0 0.5rem;
      color: #111827;
    }
    p {
      margin: 0;
      color: #4b5563;
    }
  `]
})
export class VerificacaoEstoqueComponent {}


