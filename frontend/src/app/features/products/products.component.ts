import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';

/**
 * Tela referência de layout (filtro + grid + botões + modal).
 * Usar como padrão para demais telas.
 */

@Component({
  selector: 'app-products',
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
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.scss']
})
export class ProductsComponent {
  filtroDescricao = '';
  dialogVisible = false;
  saving = false;
  editingIndex: number | null = null;
  selecionado: any[] = [];

  categorias = [
    { label: 'Categoria A', value: 'A' },
    { label: 'Categoria B', value: 'B' },
    { label: 'Categoria C', value: 'C' }
  ];

  itens = [
    { descricao: 'Notebook X', sku: 'NTX-001', categoria: 'A' },
    { descricao: 'Mouse Sem Fio', sku: 'MSW-010', categoria: 'B' },
    { descricao: 'Teclado Mecânico', sku: 'TLM-500', categoria: 'B' },
    { descricao: 'Monitor 27"', sku: 'MON-270', categoria: 'C' }
  ];

  form!: FormGroup;
  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      descricao: ['', [Validators.required, Validators.minLength(3)]],
      sku: ['', [Validators.required, Validators.minLength(3)]],
      detalhe: ['', [Validators.required, Validators.minLength(3)]],
      categoria: [null, [Validators.required]]
    });
  }

  get itensFiltrados() {
    const f = this.filtroDescricao.trim().toLowerCase();
    if (!f) return this.itens;
    return this.itens.filter((i) => i.descricao.toLowerCase().includes(f));
  }

  pesquisar(): void {
    // filtro é aplicado pelo getter; mantemos o handler para o botão
  }

  abrirModal(): void {
    this.editingIndex = null;
    this.dialogVisible = true;
    this.form.reset();
  }

  editar(): void {
    if (!this.selecionado || this.selecionado.length !== 1) return;
    const item = this.selecionado[0];
    this.editingIndex = this.itens.indexOf(item);
    this.form.reset({
      descricao: item.descricao,
      sku: item.sku,
      detalhe: item.detalhe ?? '',
      categoria: item.categoria ?? null
    });
    this.dialogVisible = true;
  }

  salvar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving = true;
    const novo = this.form.value;
    if (this.editingIndex !== null && this.editingIndex >= 0) {
      const clone = [...this.itens];
      clone[this.editingIndex] = { ...clone[this.editingIndex], ...novo };
      this.itens = clone;
    } else {
      this.itens = [...this.itens, novo];
    }
    this.saving = false;
    this.dialogVisible = false;
    this.editingIndex = null;
  }

  excluir(): void {
    if (!this.selecionado || this.selecionado.length === 0) return;
    this.itens = this.itens.filter((i) => !this.selecionado.includes(i));
    this.selecionado = [];
  }
}

