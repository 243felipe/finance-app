import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { MessageService } from 'primeng/api';

import { FonteRenda } from '../../../models/fonte-renda';
import { FonteRendaService } from '../../../services/fonte-renda.service';

@Component({
  selector: 'app-fontes-renda',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, TableModule, ButtonModule, DialogModule, InputTextModule],
  templateUrl: './fontes-renda.component.html',
  styleUrls: ['./fontes-renda.component.scss']
})
export class FontesRendaComponent implements OnInit {
  filtro = '';
  dialogVisible = false;
  saving = false;
  loading = false;
  editingId: number | null = null;
  selecionado: FonteRenda[] = [];

  itens: FonteRenda[] = [];

  form!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private service: FonteRendaService,
    private messageService: MessageService
  ) {
    this.form = this.fb.group({
      nome: ['', [Validators.required, Validators.minLength(3)]],
      descricao: [''],
      valorPadrao: [0, [Validators.required, Validators.min(0)]],
      recorrente: [false, [Validators.required]],
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

  carregar(): void {
    this.loading = true;
    this.service.list().subscribe({
      next: (data) => {
        this.itens = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Erro ao carregar fontes de renda', err);
        this.loading = false;
      }
    });
  }

  pesquisar(): void {
    // Filtro via getter; mantido para semântica/ações futuras.
  }

  abrirModal(): void {
    this.editingId = null;
    this.form.reset({ recorrente: false, ativa: true, valorPadrao: 0 });
    this.dialogVisible = true;
  }

  editar(): void {
    if (!this.selecionado || this.selecionado.length !== 1) return;
    const item = this.selecionado[0];
    this.editingId = item.id;
    this.form.reset({
      nome: item.nome,
      descricao: item.descricao,
      valorPadrao: item.valorPadrao,
      recorrente: item.recorrente,
      ativa: item.ativa
    });
    this.dialogVisible = true;
  }

  salvar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving = true;
    const payload = this.form.value as Omit<FonteRenda, 'id' | 'criadoEm' | 'atualizadoEm'>;
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
        console.error('Erro ao salvar fonte de renda', err);
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
        console.error('Erro ao excluir fontes de renda', err);
        const backendMsg = (err?.error?.message as string) || (typeof err?.error === 'string' ? err.error : 'Erro ao excluir fonte de renda.');
        const detail = `${backendMsg}
Esta fonte de renda está sendo usada em
lançamentos financeiros.

telas:
 - Tela de Receita,
 - Tela de Despesas
 - Tela de Recorrentes

Ajuste ou remova esses lançamentos antes de excluir essa renda.`;
        this.messageService.add({
          severity: 'warn',
          summary: 'Exclusão não realizada',
          detail
        });
        this.saving = false;
      }
    });
  }
}

