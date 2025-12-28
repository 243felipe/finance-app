import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';

import { FormaPagamento } from '../../../models/forma-pagamento';
import { FormaPagamentoService } from '../../../services/forma-pagamento.service';

@Component({
  selector: 'app-formas-pagamento',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, TableModule, ButtonModule, DialogModule, InputTextModule],
  templateUrl: './formas-pagamento.component.html',
  styleUrls: ['./formas-pagamento.component.scss']
})
export class FormasPagamentoComponent implements OnInit {
  filtro = '';
  dialogVisible = false;
  saving = false;
  loading = false;
  editingId: number | null = null;
  selecionado: FormaPagamento[] = [];

  itens: FormaPagamento[] = [];

  tipos = [
    { label: 'Dinheiro', value: 'D' },
    { label: 'Cartão', value: 'C' },
    { label: 'Pix', value: 'P' },
    { label: 'Transferência', value: 'T' }
  ];

  form!: FormGroup;

  constructor(private fb: FormBuilder, private service: FormaPagamentoService) {
    this.form = this.fb.group({
      nome: ['', [Validators.required, Validators.minLength(3)]],
      descricao: [''],
      tipo: [null, [Validators.required]],
      permiteParcelamento: [false, [Validators.required]],
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

  getTipoLabel(tipo: string): string {
    const found = this.tipos.find((t) => t.value === tipo);
    return found ? found.label : tipo;
  }

  carregar(): void {
    this.loading = true;
    this.service.list().subscribe({
      next: (data) => {
        this.itens = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Erro ao carregar formas de pagamento', err);
        this.loading = false;
      }
    });
  }

  pesquisar(): void {
    // Filtro via getter; mantido para semântica/ações futuras.
  }

  abrirModal(): void {
    this.editingId = null;
    this.form.reset({ permiteParcelamento: false, ativa: true, tipo: null });
    this.dialogVisible = true;
  }

  editar(): void {
    if (!this.selecionado || this.selecionado.length !== 1) return;
    const item = this.selecionado[0];
    this.editingId = item.id;
    this.form.reset({
      nome: item.nome,
      descricao: item.descricao,
      tipo: item.tipo,
      permiteParcelamento: item.permiteParcelamento,
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
    const payload = this.form.value as Omit<FormaPagamento, 'id' | 'criadoEm' | 'atualizadoEm'>;
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
        console.error('Erro ao salvar forma de pagamento', err);
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
        console.error('Erro ao excluir formas de pagamento', err);
        this.saving = false;
      }
    });
  }
}

