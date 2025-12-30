import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { forkJoin } from 'rxjs';

import { LancamentoRecorrente } from '../../../models/lancamento-recorrente';
import { LancamentoRecorrenteService } from '../../../services/lancamento-recorrente.service';
import { FinancialCategoryService } from '../../../services/financial-category.service';
import { FonteRendaService } from '../../../services/fonte-renda.service';
import { FormaPagamentoService } from '../../../services/forma-pagamento.service';
import { FinancialCategory } from '../../../models/financial-category';
import { FonteRenda } from '../../../models/fonte-renda';
import { FormaPagamento } from '../../../models/forma-pagamento';

@Component({
  selector: 'app-recorrentes-entradas',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    DialogModule
  ],
  templateUrl: './recorrentes-entradas.component.html',
  styleUrls: ['./recorrentes-entradas.component.scss']
})
export class RecorrentesEntradasComponent implements OnInit {
  filtro = '';
  loading = false;
  saving = false;
  dialogVisible = false;
  ajudaDialogVisible = false;
  editingId: number | null = null;
  selecionado: LancamentoRecorrente[] = [];
  itens: LancamentoRecorrente[] = [];
  categorias: FinancialCategory[] = [];
  fontesRenda: FonteRenda[] = [];
  formasPagamento: FormaPagamento[] = [];
  form!: FormGroup;

  constructor(
    private service: LancamentoRecorrenteService,
    private categoriaService: FinancialCategoryService,
    private fonteRendaService: FonteRendaService,
    private formaPagamentoService: FormaPagamentoService,
    private fb: FormBuilder
  ) {
    this.form = this.fb.group({
      descricao: ['', [Validators.required, Validators.minLength(3)]],
      valor: [null, [Validators.required, Validators.min(0.01)]],
      idCategoria: [null, [Validators.required]],
      idFonteRenda: [null],
      idFormaPagamento: [null],
      periodicidade: ['MENSAL', [Validators.required]],
      diaExecucao: [1, [Validators.required, Validators.min(1), Validators.max(31)]],
      dataInicio: ['', [Validators.required]],
      dataFim: [null],
      ativo: [true, [Validators.required]],
      observacao: ['']
    });
  }

  ngOnInit(): void {
    this.carregar();
    this.carregarDadosAuxiliares();
  }

  private carregarDadosAuxiliares(): void {
    forkJoin({
      categorias: this.categoriaService.list(),
      fontes: this.fonteRendaService.list(),
      formas: this.formaPagamentoService.list()
    }).subscribe({
      next: ({ categorias, fontes, formas }) => {
        // Filtra apenas categorias de entrada (tipo 'E')
        this.categorias = (categorias || []).filter((c) => c.tipo === 'E' && c.ativo);
        this.fontesRenda = (fontes || []).filter((f) => f.ativa);
        this.formasPagamento = (formas || []).filter((f) => f.ativa);
      },
      error: (err) => {
        console.error('Erro ao carregar dados auxiliares', err);
      }
    });
  }

  get itensFiltrados() {
    const f = this.filtro.trim().toLowerCase();
    if (!f) return this.itens;
    return this.itens.filter((i) => (i.descricao || '').toLowerCase().includes(f));
  }

  carregar(): void {
    this.loading = true;
    this.service.listEntradas().subscribe({
      next: (data) => {
        this.itens = data || [];
        this.loading = false;
      },
      error: (err) => {
        console.error('Erro ao carregar lançamentos recorrentes de entrada', err);
        this.loading = false;
      }
    });
  }

  formatarPeriodicidade(periodicidade: string): string {
    return periodicidade === 'MENSAL' ? 'Mensal' : 'Anual';
  }

  formatarData(data: string | null | undefined): string {
    if (!data) return '-';
    const date = new Date(data);
    return date.toLocaleDateString('pt-BR');
  }

  formatarValor(valor: number | undefined): string {
    if (valor === undefined || valor === null) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
  }

  formatarStatus(ativo: boolean): string {
    return ativo ? 'Ativo' : 'Inativo';
  }

  getCategoriaNome(id: number): string {
    const cat = this.categorias.find((c) => c.id === id);
    return cat ? cat.nome : '-';
  }

  abrirModal(): void {
    this.editingId = null;
    this.form.reset({
      descricao: '',
      valor: null,
      idCategoria: null,
      idFonteRenda: null,
      idFormaPagamento: null,
      periodicidade: 'MENSAL',
      diaExecucao: 1,
      dataInicio: this.hojeIso(),
      dataFim: null,
      ativo: true,
      observacao: ''
    });
    this.dialogVisible = true;
  }

  editar(): void {
    if (!this.selecionado || this.selecionado.length !== 1) return;
    const item = this.selecionado[0];
    if (!item.idRecorrente) return;
    this.editingId = item.idRecorrente;
    this.form.reset({
      descricao: item.descricao,
      valor: item.valor,
      idCategoria: item.idCategoria,
      idFonteRenda: item.idFonteRenda || null,
      idFormaPagamento: item.idFormaPagamento || null,
      periodicidade: item.periodicidade,
      diaExecucao: item.diaExecucao,
      dataInicio: item.dataInicio ? item.dataInicio.substring(0, 10) : this.hojeIso(),
      dataFim: item.dataFim ? item.dataFim.substring(0, 10) : null,
      ativo: item.ativo,
      observacao: item.observacao || ''
    });
    this.dialogVisible = true;
  }

  salvar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving = true;
    const payload = {
      tipo: 'E' as const,
      descricao: this.form.value.descricao,
      valor: this.form.value.valor,
      idCategoria: this.form.value.idCategoria,
      idFonteRenda: this.form.value.idFonteRenda || null,
      idFormaPagamento: this.form.value.idFormaPagamento || null,
      periodicidade: this.form.value.periodicidade,
      diaExecucao: this.form.value.diaExecucao,
      dataInicio: this.form.value.dataInicio,
      dataFim: this.form.value.dataFim || null,
      ativo: this.form.value.ativo,
      observacao: this.form.value.observacao || ''
    };
    const req$ = this.editingId
      ? this.service.update(this.editingId, payload)
      : this.service.create(payload);

    req$.subscribe({
      next: () => {
        this.saving = false;
        this.dialogVisible = false;
        this.editingId = null;
        this.carregar();
      },
      error: (err) => {
        console.error('Erro ao salvar lançamento recorrente', err);
        this.saving = false;
      }
    });
  }

  excluir(): void {
    if (!this.selecionado || this.selecionado.length === 0) return;
    const ids = this.selecionado
      .map((s) => s.idRecorrente)
      .filter((id): id is number => id !== undefined);
    if (ids.length === 0) return;
    this.saving = true;
    forkJoin(ids.map((id) => this.service.delete(id))).subscribe({
      next: () => {
        this.selecionado = [];
        this.saving = false;
        this.carregar();
      },
      error: (err) => {
        console.error('Erro ao excluir lançamentos recorrentes', err);
        this.saving = false;
      }
    });
  }

  private hojeIso(): string {
    return new Date().toISOString().substring(0, 10);
  }

  abrirModalAjuda(): void {
    this.ajudaDialogVisible = true;
  }
}
