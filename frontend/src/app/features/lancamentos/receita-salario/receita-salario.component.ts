import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';

import { LancamentoFinanceiro } from '../../../models/lancamento-financeiro';
import { FinancialCategoryService } from '../../../services/financial-category.service';
import { FonteRendaService } from '../../../services/fonte-renda.service';
import { FixedAccountService } from '../../../services/fixed-account.service';
import { FormaPagamentoService } from '../../../services/forma-pagamento.service';
import { LancamentoFinanceiroService } from '../../../services/lancamento-financeiro.service';
import { FinancialCategory } from '../../../models/financial-category';
import { FonteRenda } from '../../../models/fonte-renda';
import { FixedAccount } from '../../../models/fixed-account';
import { FormaPagamento } from '../../../models/forma-pagamento';

@Component({
  selector: 'app-receita-salario',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, TableModule, ButtonModule, DialogModule, InputTextModule],
  templateUrl: './receita-salario.component.html',
  styleUrls: ['./receita-salario.component.scss']
})
export class ReceitaSalarioComponent implements OnInit {
  filtro = '';
  dialogVisible = false;
  saving = false;
  loading = false;
  editingId: number | null = null;
  selecionado: LancamentoFinanceiro[] = [];

  itens: LancamentoFinanceiro[] = [];
  categorias: FinancialCategory[] = [];
  fontes: FonteRenda[] = [];
  contas: FixedAccount[] = [];
  formas: FormaPagamento[] = [];

  form!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private service: LancamentoFinanceiroService,
    private categoriaService: FinancialCategoryService,
    private fonteService: FonteRendaService,
    private contaService: FixedAccountService,
    private formaService: FormaPagamentoService
  ) {
    this.form = this.fb.group({
      dataLancamento: ['', [Validators.required]],
      descricao: ['', [Validators.required, Validators.minLength(3)]],
      tipo: ['E', [Validators.required]],
      valor: [null, [Validators.required, Validators.min(0.01)]],
      idCategoria: [null, [Validators.required]],
      idFonteRenda: [null],
      idContaFixa: [null],
      idFormaPagamento: [null],
      observacao: ['']
    });
  }

  ngOnInit(): void {
    this.carregar();
  }

  get itensFiltrados() {
    const f = this.filtro.trim().toLowerCase();
    if (!f) return this.itens;
    return this.itens.filter((i) => i.descricao.toLowerCase().includes(f));
  }

  private carregar(): void {
    this.loading = true;
    forkJoin([
      this.service.list(),
      this.categoriaService.list(),
      this.fonteService.list(),
      this.contaService.list(),
      this.formaService.list()
    ] as const).subscribe({
      next: ([lanc, cats, fontes, contas, formas]) => {
        this.itens = (lanc || []).filter((l: LancamentoFinanceiro) => l.tipo === 'E'); // Receita salário é entrada
        this.categorias = cats || [];
        this.fontes = fontes || [];
        this.contas = contas || [];
        this.formas = formas || [];
        this.loading = false;
      },
      error: (err) => {
        console.error('Erro ao carregar dados', err);
        this.loading = false;
      }
    });
  }

  pesquisar(): void {
    // filtro via getter
  }

  abrirModal(): void {
    this.editingId = null;
    this.form.reset({
      dataLancamento: this.hojeIso(),
      descricao: '',
      tipo: 'E',
      valor: null,
      idCategoria: null,
      idFonteRenda: null,
      idContaFixa: null,
      idFormaPagamento: null,
      observacao: ''
    });
    this.dialogVisible = true;
  }

  editar(): void {
    if (!this.selecionado || this.selecionado.length !== 1) return;
    const item = this.selecionado[0];
    this.editingId = item.id;
    this.form.reset({
      dataLancamento: item.dataLancamento?.substring(0, 10),
      descricao: item.descricao,
      tipo: item.tipo,
      valor: item.valor,
      idCategoria: item.idCategoria,
      idFonteRenda: item.idFonteRenda ?? null,
      idContaFixa: item.idContaFixa ?? null,
      idFormaPagamento: item.idFormaPagamento ?? null,
      observacao: item.observacao
    });
    this.dialogVisible = true;
  }

  salvar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving = true;
    const payload = { ...this.form.value, tipo: 'E' } as Omit<LancamentoFinanceiro, 'id' | 'criadoEm' | 'atualizadoEm' | 'categoria' | 'fonteRenda' | 'contaFixa' | 'formaPagamento'>;
    const req$ = this.editingId
      ? this.service.update(this.editingId, payload)
      : this.service.create(payload);

    req$.subscribe({
      next: () => {
        this.saving = false;
        this.dialogVisible = false;
        this.editingId = null;
        this.carregar(); // recarrega para trazer nomes via JOIN (categoria/fonte/forma)
      },
      error: (err) => {
        console.error('Erro ao salvar lançamento', err);
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
        this.selecionado = [];
        this.saving = false;
        this.carregar();
      },
      error: (err) => {
        console.error('Erro ao excluir lançamentos', err);
        this.saving = false;
      }
    });
  }

  private hojeIso(): string {
    return new Date().toISOString().substring(0, 10);
  }

  onValorInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    const onlyDigits = target.value.replace(/\D/g, '');
    const value = onlyDigits ? parseInt(onlyDigits, 10) / 100 : null;
    this.form.get('valor')?.setValue(value, { emitEvent: false });
    target.value = value !== null ? this.formatCurrency(value) : '';
  }

  onValorBlur(event: Event): void {
    const target = event.target as HTMLInputElement;
    const val = this.form.get('valor')?.value;
    if (val !== null && val !== undefined) {
      target.value = this.formatCurrency(val);
    }
  }

  onValorFocus(event: Event): void {
    const target = event.target as HTMLInputElement;
    const val = this.form.get('valor')?.value;
    if (val !== null && val !== undefined) {
      target.value = val.toString().replace('.', ',');
    }
  }

  private formatCurrency(num: number): string {
    return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
}

