import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { CheckboxModule } from 'primeng/checkbox';

import { ListaCompras, ItemListaCompras } from '../../../models/lista-compras';
import { ListaComprasService } from '../../../services/lista-compras.service';
import { ItemListaComprasService } from '../../../services/item-lista-compras.service';

@Component({
  selector: 'app-anotacoes-mercado',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    CheckboxModule
  ],
  templateUrl: './anotacoes-mercado.component.html',
  styleUrls: ['./anotacoes-mercado.component.scss']
})
export class AnotacoesMercadoComponent implements OnInit {
  // Modais
  listaDialogVisible = false;
  itemDialogVisible = false;
  saving = false;
  loading = false;
  
  // Estados
  editingListaId: number | null = null;
  editingItemId: number | null = null;
  listaSelecionadaId: number | null = null;

  // Dados
  listas: ListaCompras[] = [];
  itens: ItemListaCompras[] = [];
  itensCompletos: Set<number> = new Set();

  // Forms
  listaForm!: FormGroup;
  itemForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private listaService: ListaComprasService,
    private itemService: ItemListaComprasService
  ) {
    this.listaForm = this.fb.group({
      nome: ['', [Validators.required, Validators.minLength(2)]]
    });

    this.itemForm = this.fb.group({
      descricao: ['', [Validators.required, Validators.minLength(2)]],
      valor: [null, [Validators.min(0)]]
    });
  }

  ngOnInit(): void {
    this.carregarListas();
  }

  carregarListas(): void {
    this.loading = true;
    this.listaService.list().subscribe({
      next: (listas) => {
        this.listas = listas || [];
        this.loading = false;
        // Se houver uma lista selecionada, recarrega os itens
        if (this.listaSelecionadaId) {
          this.carregarItens(this.listaSelecionadaId);
        }
      },
      error: (err) => {
        console.error('Erro ao carregar listas', err);
        this.loading = false;
      }
    });
  }

  carregarItens(listaId: number): void {
    this.listaSelecionadaId = listaId;
    this.loading = true;
    this.itemService.list(listaId).subscribe({
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

  abrirModalLista(): void {
    this.editingListaId = null;
    this.listaForm.reset({ nome: '' });
    this.listaDialogVisible = true;
  }

  editarLista(lista: ListaCompras): void {
    this.editingListaId = lista.id;
    this.listaForm.reset({ nome: lista.nome });
    this.listaDialogVisible = true;
  }

  salvarLista(): void {
    if (this.listaForm.invalid) {
      this.listaForm.markAllAsTouched();
      return;
    }
    this.saving = true;
    const payload = { nome: this.listaForm.value.nome };
    const request$ = this.editingListaId
      ? this.listaService.update(this.editingListaId, payload)
      : this.listaService.create(payload);

    request$.subscribe({
      next: (lista) => {
        if (this.editingListaId) {
          this.listas = this.listas.map((l) => (l.id === lista.id ? lista : l));
        } else {
          this.listas = [lista, ...this.listas];
        }
        this.saving = false;
        this.listaDialogVisible = false;
        this.editingListaId = null;
      },
      error: (err) => {
        console.error('Erro ao salvar lista', err);
        this.saving = false;
      }
    });
  }

  excluirLista(lista: ListaCompras): void {
    if (!confirm(`Deseja realmente excluir a lista "${lista.nome}"? Todos os itens serão excluídos também.`)) {
      return;
    }
    this.saving = true;
    this.listaService.delete(lista.id).subscribe({
      next: () => {
        this.listas = this.listas.filter((l) => l.id !== lista.id);
        if (this.listaSelecionadaId === lista.id) {
          this.listaSelecionadaId = null;
          this.itens = [];
        }
        this.saving = false;
      },
      error: (err) => {
        console.error('Erro ao excluir lista', err);
        this.saving = false;
      }
    });
  }

  abrirModalItem(): void {
    if (!this.listaSelecionadaId) {
      alert('Selecione uma lista primeiro');
      return;
    }
    this.editingItemId = null;
    this.itemForm.reset({ descricao: '', valor: null });
    this.itemDialogVisible = true;
  }

  editarItem(item: ItemListaCompras): void {
    this.editingItemId = item.id;
    this.itemForm.reset({
      descricao: item.descricao,
      valor: item.valor
    });
    this.itemDialogVisible = true;
  }

  salvarItem(): void {
    if (this.itemForm.invalid || !this.listaSelecionadaId) {
      this.itemForm.markAllAsTouched();
      return;
    }
    this.saving = true;
    const payload = {
      listaComprasId: this.listaSelecionadaId,
      descricao: this.itemForm.value.descricao,
      valor: this.itemForm.value.valor || 0
    };
    const request$ = this.editingItemId
      ? this.itemService.update(this.editingItemId, { descricao: payload.descricao, valor: payload.valor })
      : this.itemService.create(payload);

    request$.subscribe({
      next: (item) => {
        if (this.editingItemId) {
          this.itens = this.itens.map((i) => (i.id === item.id ? item : i));
        } else {
          this.itens = [item, ...this.itens];
        }
        this.saving = false;
        this.itemDialogVisible = false;
        this.editingItemId = null;
      },
      error: (err) => {
        console.error('Erro ao salvar item', err);
        this.saving = false;
      }
    });
  }

  excluirItem(item: ItemListaCompras): void {
    if (!confirm(`Deseja realmente excluir "${item.descricao}"?`)) {
      return;
    }
    this.saving = true;
    this.itemService.delete(item.id).subscribe({
      next: () => {
        this.itens = this.itens.filter((i) => i.id !== item.id);
        this.itensCompletos.delete(item.id);
        this.saving = false;
      },
      error: (err) => {
        console.error('Erro ao excluir item', err);
        this.saving = false;
      }
    });
  }

  toggleCompleto(item: ItemListaCompras): void {
    if (this.itensCompletos.has(item.id)) {
      this.itensCompletos.delete(item.id);
    } else {
      this.itensCompletos.add(item.id);
    }
  }

  isCompleto(item: ItemListaCompras): boolean {
    return this.itensCompletos.has(item.id);
  }

  get listaSelecionada(): ListaCompras | null {
    return this.listas.find((l) => l.id === this.listaSelecionadaId) || null;
  }

  get totalItens(): number {
    return this.itens.length;
  }

  get itensCompletados(): number {
    return this.itensCompletos.size;
  }

  get valorTotal(): number {
    return this.itens.reduce((sum, item) => sum + (item.valor || 0), 0);
  }

  formatCurrency(value: number): string {
    return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
}
