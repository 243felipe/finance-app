import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';

/**
 * Tela referência (Rendas > Cadastro > Salários): mesma base de layout padrão
 * usada como exemplo (filtro + grid + botões + modal).
 */
@Component({
  selector: 'app-salarios',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TableModule,
    ButtonModule,
    DialogModule,
    InputTextModule
  ],
  templateUrl: './salarios.component.html',
  styleUrls: ['./salarios.component.scss']
})
export class SalariosComponent {
  filtroDescricao = '';
  dialogVisible = false;
  saving = false;
  selecionado: any[] = [];

  tipos = [
    { label: 'Mensal', value: 'Mensal' },
    { label: 'Bônus', value: 'Bônus' },
    { label: '13º', value: '13º' }
  ];

  itens = [
    { colaborador: 'Ana Lima', competencia: 'Jan/2025', valor: 'R$ 8.200,00', tipo: 'Mensal' },
    { colaborador: 'Bruno Silva', competencia: 'Jan/2025', valor: 'R$ 6.900,00', tipo: 'Mensal' },
    { colaborador: 'Carla Souza', competencia: 'Jan/2025', valor: 'R$ 2.000,00', tipo: 'Bônus' }
  ];

  form!: FormGroup;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      colaborador: ['', [Validators.required, Validators.minLength(3)]],
      competencia: ['', [Validators.required]],
      valor: ['', [Validators.required]],
      tipo: [null, [Validators.required]]
    });
  }

  get itensFiltrados() {
    const f = this.filtroDescricao.trim().toLowerCase();
    if (!f) return this.itens;
    return this.itens.filter((i) => i.colaborador.toLowerCase().includes(f));
  }

  pesquisar(): void {
    // filtro já é aplicado pelo getter; handler mantido para semântica do botão
  }

  abrirModal(): void {
    this.dialogVisible = true;
    this.form.reset();
  }

  salvar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving = true;
    const novo = this.form.value;
    this.itens = [...this.itens, novo];
    this.saving = false;
    this.dialogVisible = false;
  }

  excluir(): void {
    if (!this.selecionado || this.selecionado.length === 0) return;
    this.itens = this.itens.filter((i) => !this.selecionado.includes(i));
    this.selecionado = [];
  }

  carregar(): void {
    // Recarrega os dados (para componentes com dados estáticos, apenas limpa o filtro)
    this.filtroDescricao = '';
  }
}
