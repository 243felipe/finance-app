import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';

import { ListaCompras, ItemListaCompras } from '../../../models/lista-compras';
import { ListaComprasService } from '../../../services/lista-compras.service';
import { ItemListaComprasService } from '../../../services/item-lista-compras.service';
import { FinancialCategoryService } from '../../../services/financial-category.service';
import { FormaPagamentoService } from '../../../services/forma-pagamento.service';
import { FinancialCategory } from '../../../models/financial-category';
import { FormaPagamento } from '../../../models/forma-pagamento';

@Component({
  selector: 'app-lancamento-mercado',
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
  templateUrl: './lancamento-mercado.component.html',
  styleUrls: ['./lancamento-mercado.component.scss']
})
export class LancamentoMercadoComponent implements OnInit {
  filtro = '';
  dialogVisible = false;
  saving = false;
  loading = false;
  editingId: number | null = null;
  selecionado: ItemListaCompras[] = [];
  listaSelecionadaId: number | null = null;

  listas: ListaCompras[] = [];
  itens: ItemListaCompras[] = [];
  categorias: FinancialCategory[] = [];
  formasPagamento: FormaPagamento[] = [];

  form!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private listaService: ListaComprasService,
    private itemService: ItemListaComprasService,
    private categoriaService: FinancialCategoryService,
    private formaPagamentoService: FormaPagamentoService
  ) {
    this.form = this.fb.group({
      listaComprasId: [null, [Validators.required]],
      descricao: ['', [Validators.required, Validators.minLength(2)]],
      valor: [null, [Validators.required, Validators.min(0.01)]],
      idCategoria: [null],
      idFormaPagamento: [null]
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

  get listaSelecionada(): ListaCompras | null {
    return this.listas.find((l) => l.id === this.listaSelecionadaId) || null;
  }

  carregar(): void {
    this.loading = true;
    forkJoin([
      this.listaService.list(),
      this.categoriaService.list(),
      this.formaPagamentoService.list()
    ] as const).subscribe({
      next: ([listas, cats, formas]) => {
        this.listas = listas || [];
        this.categorias = (cats || []).filter((c: FinancialCategory) => c.tipo === 'S' && c.ativo);
        this.formasPagamento = (formas || []).filter((f: FormaPagamento) => f.ativa);
        this.loading = false;
        // Se houver uma lista selecionada, carrega os itens
        if (this.listaSelecionadaId) {
          this.carregarItens();
        }
      },
      error: (err) => {
        console.error('Erro ao carregar dados', err);
        this.loading = false;
      }
    });
  }

  carregarItens(): void {
    if (!this.listaSelecionadaId) return;
    this.loading = true;
    this.itemService.list(this.listaSelecionadaId).subscribe({
      next: (itens) => {
        this.itens = itens || [];
        this.loading = false;
      },
      error: (err) => {
        console.error('Erro ao carregar itens', err);
        this.loading = false;
      }
    });
  }


  pesquisar(): void {
    // Filtro feito via getter
  }

  abrirModal(): void {
    if (!this.listaSelecionadaId) {
      alert('Selecione uma lista primeiro');
      return;
    }
    this.editingId = null;
    this.form.reset({
      listaComprasId: this.listaSelecionadaId,
      descricao: '',
      valor: null,
      idCategoria: null,
      idFormaPagamento: null
    });
    this.dialogVisible = true;
  }

  editar(): void {
    if (!this.selecionado || this.selecionado.length !== 1) return;
    const item = this.selecionado[0];
    this.editingId = item.id;
    this.form.reset({
      listaComprasId: item.listaComprasId,
      descricao: item.descricao,
      valor: item.valor,
      idCategoria: null,
      idFormaPagamento: null
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
      descricao: this.form.value.descricao,
      valor: this.form.value.valor
    };
    const request$ = this.editingId
      ? this.itemService.update(this.editingId, payload)
      : this.itemService.create({
          listaComprasId: this.form.value.listaComprasId,
          descricao: this.form.value.descricao,
          valor: this.form.value.valor
        });

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
        console.error('Erro ao salvar lançamento', err);
        this.saving = false;
      }
    });
  }

  excluir(): void {
    if (!this.selecionado || this.selecionado.length === 0) return;
    const ids = this.selecionado.map((s) => s.id);
    this.saving = true;
    forkJoin(ids.map((id) => this.itemService.delete(id))).subscribe({
      next: () => {
        this.itens = this.itens.filter((i) => !ids.includes(i.id));
        this.selecionado = [];
        this.saving = false;
      },
      error: (err) => {
        console.error('Erro ao excluir lançamentos', err);
        this.saving = false;
      }
    });
  }

  formatCurrency(value: number): string {
    return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
}
