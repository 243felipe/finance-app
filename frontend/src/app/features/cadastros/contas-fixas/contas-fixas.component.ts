import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';

import { FixedAccount } from '../../../models/fixed-account';
import { FinancialCategory } from '../../../models/financial-category';
import { FixedAccountService } from '../../../services/fixed-account.service';
import { FinancialCategoryService } from '../../../services/financial-category.service';

@Component({
  selector: 'app-contas-fixas',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, TableModule, ButtonModule, DialogModule, InputTextModule],
  templateUrl: './contas-fixas.component.html',
  styleUrls: ['./contas-fixas.component.scss']
})
export class ContasFixasComponent implements OnInit {
  filtro = '';
  dialogVisible = false;
  saving = false;
  loading = false;
  editingId: number | null = null;
  selecionado: FixedAccount[] = [];

  itens: FixedAccount[] = [];
  categorias: FinancialCategory[] = [];

  form!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private service: FixedAccountService,
    private categoriaService: FinancialCategoryService
  ) {
    this.form = this.fb.group({
      nome: ['', [Validators.required, Validators.minLength(3)]],
      descricao: [''],
      idCategoria: [null, [Validators.required]],
      valor: [null, [Validators.required, Validators.min(0.01)]],
      diaVencimento: [null, [Validators.required, Validators.min(1), Validators.max(31)]],
      ativa: [true, [Validators.required]]
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

  getCategoriaNome(idCategoria: number): string {
    const cat = this.categorias.find((c) => c.id === idCategoria);
    return cat ? cat.nome : '-';
  }

  carregar(): void {
    this.loading = true;
    forkJoin([this.service.list(), this.categoriaService.list()]).subscribe({
      next: ([contas, categorias]) => {
        this.itens = contas;
        this.categorias = categorias;
        this.loading = false;
      },
      error: (err) => {
        console.error('Erro ao carregar contas fixas', err);
        this.loading = false;
      }
    });
  }

  pesquisar(): void {
    // Filtro via getter; mantido para semântica/ações futuras.
  }

  abrirModal(): void {
    this.editingId = null;
    this.form.reset({ ativa: true, idCategoria: null });
    this.dialogVisible = true;
  }

  editar(): void {
    if (!this.selecionado || this.selecionado.length !== 1) return;
    const item = this.selecionado[0];
    this.editingId = item.id;
    this.form.reset({
      nome: item.nome,
      descricao: item.descricao,
      idCategoria: item.idCategoria,
      valor: item.valor,
      diaVencimento: item.diaVencimento,
      ativa: item.ativa
    });
    this.dialogVisible = true;
  }

  onValorInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    const onlyDigits = target.value.replace(/\D/g, '');
    const value = onlyDigits ? parseInt(onlyDigits, 10) / 100 : null;
    this.form.get('valor')?.setValue(value, { emitEvent: false });
    target.value = value !== null ? this.formatValor(value) : '';
  }

  onValorBlur(event: Event): void {
    const target = event.target as HTMLInputElement;
    const val = this.form.get('valor')?.value;
    if (val !== null && val !== undefined) {
      target.value = this.formatValor(val);
    }
  }

  onValorFocus(event: Event): void {
    const target = event.target as HTMLInputElement;
    const val = this.form.get('valor')?.value;
    if (val !== null && val !== undefined) {
      // Remove formatação para facilitar edição
      target.value = val.toString().replace('.', ',');
    }
  }

  private formatValor(num: number): string {
    return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  salvar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving = true;
    const payload = this.form.value as Omit<FixedAccount, 'id' | 'criadoEm' | 'atualizadoEm'>;
    const request$ = this.editingId
      ? this.service.update(this.editingId, payload)
      : this.service.create(payload);

    request$.subscribe({
      next: (entity) => {
        if (this.editingId) {
          this.itens = this.itens.map((i) => (i.id === entity.id ? entity : i));
        } else {
          this.itens = [entity, ...this.itens];
        }
        this.saving = false;
        this.dialogVisible = false;
        this.editingId = null;
      },
      error: (err) => {
        console.error('Erro ao salvar conta fixa', err);
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
        console.error('Erro ao excluir contas fixas', err);
        this.saving = false;
      }
    });
  }
}

