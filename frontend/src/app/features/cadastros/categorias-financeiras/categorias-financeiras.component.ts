import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';

import { FinancialCategory } from '../../../models/financial-category';
import { FinancialCategoryService } from '../../../services/financial-category.service';

/**
 * Tela de Categorias Financeiras (padrão Produtos):
 * - Busca + botões
 * - Grid com seleção
 * - Modal para cadastro
 * Agora integrada ao backend (CRUD real).
 */
@Component({
  selector: 'app-categorias-financeiras',
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
  templateUrl: './categorias-financeiras.component.html',
  styleUrls: ['./categorias-financeiras.component.scss']
})
export class CategoriasFinanceirasComponent implements OnInit {
  filtro = '';
  dialogVisible = false;
  saving = false;
  loading = false;
  selecionado: FinancialCategory[] = [];

  tipos = [
    { label: 'Entrada', value: 'E' },
    { label: 'Saída', value: 'S' }
  ];

  itens: FinancialCategory[] = [];

  form!: FormGroup;

  constructor(private fb: FormBuilder, private service: FinancialCategoryService) {
    this.form = this.fb.group({
      nome: ['', [Validators.required, Validators.minLength(3)]],
      tipo: [null, [Validators.required]],
      descricao: [''],
      ativo: [true, [Validators.required]]
    });
  }

  ngOnInit(): void {
    this.carregar();
  }

  get itensFiltrados() {
    const f = this.filtro.trim().toLowerCase();
    if (!f) return this.itens;
    return this.itens.filter((i) => i.nome.toLowerCase().includes(f));
  }

  carregar(): void {
    this.loading = true;
    this.service.list().subscribe({
      next: (data) => {
        this.itens = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Erro ao carregar categorias financeiras', err);
        this.loading = false;
      }
    });
  }

  pesquisar(): void {
    // Filtro feito via getter; mantido para semântica/ações futuras.
  }

  abrirModal(): void {
    this.form.reset({ ativo: true, tipo: null });
    this.dialogVisible = true;
  }

  salvar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving = true;
    const payload = this.form.value as Omit<FinancialCategory, 'id' | 'criadoEm' | 'atualizadoEm'>;
    this.service.create(payload).subscribe({
      next: (novo) => {
        this.itens = [novo, ...this.itens];
        this.saving = false;
        this.dialogVisible = false;
      },
      error: (err) => {
        console.error('Erro ao salvar categoria financeira', err);
        this.saving = false;
      }
    });
  }

  excluir(): void {
    if (!this.selecionado || this.selecionado.length === 0) return;
    const ids = this.selecionado.map((s) => s.id);
    this.saving = true;
    forkJoin(ids.map((id) => this.service.delete(id))).subscribe({
      next: () => {
        this.itens = this.itens.filter((i) => !ids.includes(i.id));
        this.selecionado = [];
        this.saving = false;
      },
      error: (err) => {
        console.error('Erro ao excluir categorias financeiras', err);
        this.saving = false;
      }
    });
  }
}
