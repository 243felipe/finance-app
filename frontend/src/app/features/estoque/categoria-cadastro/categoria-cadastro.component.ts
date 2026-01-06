import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { CategoriaService, Categoria, CategoriaPayload } from '../../../services/categoria.service';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-categoria-cadastro',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    HttpClientModule,
    DialogModule,
    InputTextModule,
    CheckboxModule,
    ButtonModule,
    ToastModule
  ],
  providers: [MessageService],
  template: `
    <section class="estoque-page">
      <p-toast></p-toast>
      <header class="page-header">
        <div>
          <p class="eyebrow">Estoque</p>
          <h1>Cadastro de Categoria</h1>
        </div>
        <button pButton label="Nova categoria" icon="pi pi-plus" class="btn-primary" (click)="openDialog()"></button>
      </header>

      <div class="placeholder-card">
        <p *ngIf="loading">Carregando categorias...</p>
        <p *ngIf="!loading && categorias.length === 0">Nenhuma categoria cadastrada.</p>
        <table *ngIf="!loading && categorias.length > 0" class="simple-table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Ativo</th>
              <th style="width: 120px;">Ações</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let c of categorias">
              <td>{{ c.nome }}</td>
              <td>{{ c.ativo ? 'Sim' : 'Não' }}</td>
              <td class="actions">
                <button pButton type="button" icon="pi pi-pencil" class="p-button-text" (click)="editar(c)"></button>
                <button pButton type="button" icon="pi pi-trash" class="p-button-text p-button-danger" (click)="remover(c)"></button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <p-dialog
        header="Cadastrar categoria"
        [(visible)]="dialogVisible"
        [modal]="true"
        [style]="{ width: '420px' }"
        [closable]="false"
      >
        <form [formGroup]="form" class="dialog-form">
          <div class="field">
            <label for="nome">Nome</label>
            <input id="nome" type="text" pInputText formControlName="nome" placeholder="Ex: Matéria-prima" />
            <small *ngIf="form.get('nome')?.invalid && form.get('nome')?.touched" class="error">
              Informe o nome.
            </small>
          </div>

          <div class="field checkbox-field">
            <p-checkbox inputId="ativo" binary="true" formControlName="ativo"></p-checkbox>
            <label for="ativo">Ativo</label>
          </div>

          <div class="dialog-actions">
            <button pButton type="button" label="Cancelar" class="p-button-text" (click)="closeDialog()"></button>
            <button pButton type="button" label="Salvar" [disabled]="form.invalid" (click)="salvar()"></button>
          </div>
        </form>
      </p-dialog>
    </section>
  `,
  styles: [`
    .estoque-page {
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
    }
    .eyebrow {
      margin: 0;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      font-size: 0.8rem;
    }
    h1 {
      margin: 0;
      color: #111827;
      font-size: 1.5rem;
    }
    .btn-primary {
      background: #00bab6;
      border: 1px solid #00bab6;
      color: #ffffff;
    }
    .btn-primary:hover {
      background: #0aa39f;
      border-color: #0aa39f;
    }
    .placeholder-card {
      padding: 1rem;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      background: #f8fafc;
      color: #475569;
    }
    .simple-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.9rem;
    }
    .simple-table th,
    .simple-table td {
      border: 1px solid #e2e8f0;
      padding: 0.5rem 0.6rem;
      text-align: left;
      color: #111827;
    }
    .simple-table thead {
      background: #f1f5f9;
    }
    .dialog-form {
      display: grid;
      gap: 0.75rem;
    }
    .field {
      display: grid;
      gap: 0.35rem;
    }
    label {
      font-weight: 600;
      color: #111827;
    }
    .checkbox-field {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .dialog-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem;
      margin-top: 0.25rem;
    }
    .error {
      color: #ef4444;
      font-size: 0.82rem;
    }
    .feedback {
      margin: 0;
      color: #0ea5e9;
      font-size: 0.85rem;
    }
  `]
})
export class CategoriaCadastroComponent implements OnInit {
  dialogVisible = false;
  categorias: Categoria[] = [];
  loading = false;
  saving = false;
  form!: FormGroup;
  editingId: number | null = null;

  constructor(
    private fb: FormBuilder,
    private categoriaService: CategoriaService,
    private messageService: MessageService
  ) {
    this.form = this.fb.group({
      nome: ['', [Validators.required, Validators.maxLength(100)]],
      ativo: [true]
    });
  }

  ngOnInit(): void {
    this.loadCategorias();
  }

  openDialog(): void {
    this.dialogVisible = true;
  }

  closeDialog(): void {
    this.dialogVisible = false;
    this.editingId = null;
    this.form.reset({ nome: '', ativo: true });
  }

  salvar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving = true;
    const payload: CategoriaPayload = {
      nome: this.form.value.nome,
      ativo: this.form.value.ativo
    };
    const obs = this.editingId
      ? this.categoriaService.atualizar(this.editingId, payload)
      : this.categoriaService.criar(payload);

    obs.subscribe({
      next: () => {
        this.saving = false;
        this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Categoria salva com sucesso.' });
        this.closeDialog();
        this.loadCategorias();
      },
      error: (err) => {
        this.saving = false;
        const detail = err?.error?.message || 'Erro ao salvar categoria.';
        this.messageService.add({ severity: 'error', summary: 'Erro', detail });
      }
    });
  }

  private loadCategorias(): void {
    this.loading = true;
    this.categoriaService.listar().subscribe({
      next: (data) => {
        this.categorias = data ?? [];
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  editar(c: Categoria): void {
    this.editingId = c.id;
    this.form.patchValue({
      nome: c.nome,
      ativo: c.ativo
    });
    this.dialogVisible = true;
  }

  remover(c: Categoria): void {
    this.categoriaService.remover(c.id).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Categoria excluída.' });
        this.loadCategorias();
      },
      error: (err) => {
        const detail = err?.error?.message || 'Erro ao excluir categoria.';
        this.messageService.add({ severity: 'error', summary: 'Erro', detail });
      }
    });
  }
}

