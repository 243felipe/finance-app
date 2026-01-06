import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { ProdutoService, ProdutoPayload, Produto } from '../../../services/produto.service';
import { CategoriaService, Categoria } from '../../../services/categoria.service';

type Option = { label: string; value: string | number | null };

@Component({
  selector: 'app-produto-cadastro',
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
          <h1>Cadastro de Produtos</h1>
        </div>
        <button pButton label="Novo produto" icon="pi pi-plus" class="btn-primary" (click)="openDialog()"></button>
      </header>

      <div class="placeholder-card">
        <p *ngIf="loading">Carregando produtos...</p>
        <p *ngIf="!loading && (produtos?.length ?? 0) === 0">Nenhum produto cadastrado.</p>
        <table *ngIf="!loading && (produtos?.length ?? 0) > 0" class="simple-table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Categoria</th>
              <th>Unidade</th>
              <th>Ativo</th>
              <th style="width: 120px;">Ações</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let p of produtos">
              <td>{{ p.nome }}</td>
              <td>{{ p.categoria || '-' }}</td>
              <td>{{ p.unidade }}</td>
              <td>{{ p.ativo ? 'Sim' : 'Não' }}</td>
              <td class="actions">
                <button pButton type="button" icon="pi pi-pencil" class="p-button-text" (click)="editar(p)"></button>
                <button pButton type="button" icon="pi pi-trash" class="p-button-text p-button-danger" (click)="remover(p)"></button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <p-dialog
        header="Cadastrar produto"
        [(visible)]="dialogVisible"
        [modal]="true"
        [style]="{ width: '620px' }"
        [contentStyle]="{ 'border-radius': '0 0 14px 14px', padding: '1.2rem' }"
        styleClass="produto-dialog"
        [closable]="false"
      >
        <form [formGroup]="form" class="dialog-form">
          <div class="field">
            <label for="nome">Nome</label>
            <input id="nome" type="text" pInputText formControlName="nome" placeholder="Ex: Parafuso 10mm" />
            <small *ngIf="form.get('nome')?.invalid && form.get('nome')?.touched" class="error">
              Informe o nome.
            </small>
          </div>

          <div class="field">
            <label for="descricao">Descrição</label>
            <input id="descricao" type="text" pInputText formControlName="descricao" placeholder="Descrição opcional" />
          </div>

          <div class="double-field">
            <div class="field">
              <label for="categoria">Categoria</label>
              <select id="categoria" formControlName="id_categoria" class="p-inputtext p-component">
                <option [ngValue]="null" disabled selected>Selecione</option>
                <option *ngFor="let c of categoriasOptions" [ngValue]="c.value">{{ c.label }}</option>
              </select>
            </div>

            <div class="field">
              <label for="unidade">Unidade</label>
              <select id="unidade" formControlName="unidade" class="p-inputtext p-component">
                <option [ngValue]="null" disabled selected>Selecione</option>
                <option *ngFor="let u of unidades" [ngValue]="u.value">{{ u.label }}</option>
              </select>
            </div>
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
      gap: 0.7rem;
    }
    :host ::ng-deep .produto-dialog .p-dialog {
      border-radius: 14px !important;
      overflow: hidden;
    }
    :host ::ng-deep .produto-dialog .p-dialog-header {
      border-radius: 14px 14px 0 0 !important;
      padding: 1rem 1.25rem;
    }
    :host ::ng-deep .produto-dialog .p-dialog-content {
      padding: 1.2rem !important;
      border-radius: 0 0 14px 14px !important;
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
    .double-field {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 0.75rem;
    }
    .prefix-input {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 0.4rem 0.6rem;
    }
    .prefix-input input {
      border: none;
      flex: 1;
      background: transparent;
      outline: none;
    }
    .prefix-input span {
      font-weight: 600;
      color: #0f172a;
    }
    .total-box {
      border: 1px solid #e2e8f0;
      background: #f8fafc;
      border-radius: 8px;
      padding: 0.65rem 0.8rem;
      font-weight: 700;
      color: #0f172a;
    }
    .error {
      color: #ef4444;
      font-size: 0.82rem;
    }
  `]
})
export class ProdutoCadastroComponent {
  dialogVisible = false;
  categoriasOptions: Option[] = [{ label: 'Selecione', value: null }];
  unidades: Option[] = [
    { label: 'UN - Unidade', value: 'UN' },
    { label: 'KG - Quilo', value: 'KG' },
    { label: 'L - Litro', value: 'L' }
  ];

  form!: FormGroup;
  saving = false;
  loading = false;
  produtos: Produto[] = [];
  editingId: number | null = null;

  constructor(
    private fb: FormBuilder,
    private produtoService: ProdutoService,
    private categoriaService: CategoriaService,
    private messageService: MessageService
  ) {
    this.form = this.fb.group({
      nome: ['', [Validators.required, Validators.maxLength(150)]],
      descricao: [''],
      id_categoria: [null],
      unidade: [null, Validators.required],
      ativo: [true]
    });
  }

  ngOnInit(): void {
    this.loadProdutos();
    this.loadCategorias();
  }

  openDialog(): void {
    this.dialogVisible = true;
  }

  closeDialog(): void {
    this.dialogVisible = false;
    this.editingId = null;
    this.form.reset({
      nome: '',
      descricao: '',
      id_categoria: null,
      unidade: null,
      ativo: true
    });
  }

  salvar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving = true;
    const payload: ProdutoPayload = {
      nome: this.form.value.nome,
      descricao: this.form.value.descricao,
      idCategoria: this.form.value.id_categoria,
      unidade: this.form.value.unidade,
      ativo: this.form.value.ativo
    };
    const obs = this.editingId
      ? this.produtoService.atualizar(this.editingId, payload)
      : this.produtoService.criar(payload);

    obs.subscribe({
      next: () => {
        this.saving = false;
        this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Produto salvo com sucesso.' });
        this.closeDialog();
        this.loadProdutos();
      },
      error: (err) => {
        this.saving = false;
        const detail = err?.error?.message || 'Erro ao salvar produto.';
        this.messageService.add({ severity: 'error', summary: 'Erro', detail });
      }
    });
  }

  private loadProdutos(): void {
    this.loading = true;
    this.produtoService.listar().subscribe({
      next: (data) => {
        this.produtos = data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  private loadCategorias(): void {
    this.categoriaService.listar().subscribe({
      next: (data: Categoria[]) => {
        const opts: Option[] = [{ label: 'Selecione', value: null }];
        if (data && data.length) {
          data.forEach((c) => opts.push({ label: c.nome, value: c.id }));
        }
        this.categoriasOptions = opts;
      },
      error: () => {
        this.categoriasOptions = [{ label: 'Selecione', value: null }];
      }
    });
  }

  editar(p: Produto): void {
    this.editingId = p.id;
    this.form.patchValue({
      nome: p.nome,
      descricao: p.descricao || '',
      id_categoria: p.idCategoria ?? null,
      unidade: p.unidade,
      ativo: p.ativo
    });
    this.dialogVisible = true;
  }

  remover(p: Produto): void {
    this.produtoService.remover(p.id).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Produto excluído.' });
        this.loadProdutos();
      },
      error: (err) => {
        const detail = err?.error?.message || 'Erro ao excluir produto.';
        this.messageService.add({ severity: 'error', summary: 'Erro', detail });
      }
    });
  }
}


