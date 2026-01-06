import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { EstoqueMovimentacaoService, EstoqueMovimentacao, EstoqueMovimentacaoPayload } from '../../../services/estoque-movimentacao.service';
import { ProdutoService, Produto } from '../../../services/produto.service';

@Component({
  selector: 'app-entrada-estoque',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule, DialogModule, InputTextModule, ButtonModule, ToastModule],
  providers: [MessageService],
  template: `
    <section class="estoque-page">
      <p-toast></p-toast>
      <header class="page-header">
        <div>
          <p class="eyebrow">Estoque</p>
          <h1>Entrada de Estoque</h1>
        </div>
        <button pButton label="Nova entrada" icon="pi pi-plus" class="btn-primary" (click)="openDialog()"></button>
      </header>

      <div class="placeholder-card">
        <p *ngIf="loading">Carregando movimentações...</p>
        <p *ngIf="!loading && movimentacoes.length === 0">Nenhuma movimentação registrada.</p>
        <table *ngIf="!loading && movimentacoes.length > 0" class="simple-table">
          <thead>
            <tr>
              <th>Produto</th>
              <th>Tipo</th>
              <th>Quantidade</th>
              <th>Valor</th>
              <th>Data</th>
              <th>Observação</th>
              <th style="width: 120px;">Ações</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let m of movimentacoes">
              <td>{{ m.produto || m.idProduto }}</td>
              <td>{{ m.tipo }}</td>
              <td>{{ m.quantidade }}</td>
              <td>{{ m.valor | currency: 'BRL':'symbol':'1.2-2' }}</td>
              <td>{{ m.dataMovimentacao | date:'dd/MM/yyyy HH:mm' }}</td>
              <td>{{ m.observacao || '-' }}</td>
              <td class="actions">
                <button
                  pButton
                  type="button"
                  icon="pi pi-pencil"
                  class="p-button-text"
                  (click)="editar(m)"
                  [disabled]="m.tipo === 'SAIDA'"
                ></button>
                <button
                  pButton
                  type="button"
                  icon="pi pi-trash"
                  class="p-button-text p-button-danger"
                  (click)="remover(m)"
                  [disabled]="m.tipo === 'SAIDA'"
                ></button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <p-dialog
        header="Registrar movimentação"
        [(visible)]="dialogVisible"
        [modal]="true"
        [style]="{ width: '620px' }"
        [closable]="false"
      >
        <form [formGroup]="form" class="dialog-form">
          <div class="double-field">
            <div class="field">
              <label for="produto">Produto</label>
              <select id="produto" formControlName="id_produto" class="p-inputtext p-component">
                <option [ngValue]="null" disabled selected>Selecione</option>
                <option *ngFor="let p of produtoOptions" [ngValue]="p.value">{{ p.label }}</option>
              </select>
              <small *ngIf="form.get('id_produto')?.invalid && form.get('id_produto')?.touched" class="error">
                Escolha o produto.
              </small>
            </div>

            <div class="field">
              <label for="tipo">Tipo</label>
              <select id="tipo" formControlName="tipo" class="p-inputtext p-component">
                <option *ngFor="let t of tipos" [ngValue]="t">{{ t }}</option>
              </select>
            </div>
          </div>

          <div class="double-field">
            <div class="field">
              <label for="quantidade">Quantidade</label>
              <input
                id="quantidade"
                type="number"
                min="0"
                step="0.001"
                pInputText
                formControlName="quantidade"
                placeholder="Ex: 10"
              />
              <small *ngIf="form.get('quantidade')?.invalid && form.get('quantidade')?.touched" class="error">
                Informe a quantidade.
              </small>
            </div>

            <div class="field">
              <label for="valor">Valor</label>
              <div class="prefix-input">
                <input
                  id="valor"
                  type="text"
                  inputmode="decimal"
                  pInputText
                  formControlName="valor"
                  placeholder="R$ 0,00"
                  (input)="onValorInput($event)"
                />
              </div>
              <small *ngIf="form.get('valor')?.invalid && form.get('valor')?.touched" class="error">
                Informe o valor.
              </small>
            </div>
          </div>

          <div class="field">
            <label>Total (Quantidade x Valor)</label>
            <div class="total-box">{{ total | currency: 'BRL':'symbol':'1.2-2' }}</div>
          </div>

          <div class="field">
            <label for="observacao">Observação</label>
            <textarea id="observacao" rows="3" class="p-inputtext p-component" formControlName="observacao" placeholder="Opcional"></textarea>
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
    .double-field {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
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
    .dialog-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem;
      margin-top: 0.25rem;
    }
    .actions button[disabled] {
      opacity: 0.5;
      pointer-events: none;
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
    textarea {
      resize: vertical;
    }
  `]
})
export class EntradaEstoqueComponent implements OnInit {
  dialogVisible = false;
  tipos = ['ENTRADA'];
  produtoOptions: { label: string; value: number }[] = [];
  movimentacoes: EstoqueMovimentacao[] = [];
  loading = false;
  saving = false;
  form!: FormGroup;
  editingId: number | null = null;
  valorNumerico = 0;

  constructor(
    private fb: FormBuilder,
    private movService: EstoqueMovimentacaoService,
    private produtoService: ProdutoService,
    private messageService: MessageService
  ) {
    this.form = this.fb.group({
      id_produto: [null, Validators.required],
      tipo: ['ENTRADA', Validators.required],
      quantidade: [0, [Validators.required, Validators.min(0)]],
      valor: ['R$ 0,00', [Validators.required]],
      observacao: ['']
    });
  }

  ngOnInit(): void {
    this.loadProdutos();
    this.loadMovimentacoes();
  }

  openDialog(): void {
    this.dialogVisible = true;
  }

  closeDialog(): void {
    this.dialogVisible = false;
    this.editingId = null;
    this.form.reset({
      id_produto: null,
      tipo: 'ENTRADA',
      quantidade: 0,
      valor: 'R$ 0,00',
      observacao: ''
    });
    this.valorNumerico = 0;
  }

  salvar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving = true;
    const payload: EstoqueMovimentacaoPayload = {
      idProduto: this.form.value.id_produto,
      tipo: this.form.value.tipo,
      quantidade: Number(this.form.value.quantidade) || 0,
      valor: (Number(this.form.value.quantidade) || 0) * this.valorNumerico,
      observacao: this.form.value.observacao
    };

    const obs = this.editingId
      ? this.movService.atualizar(this.editingId, payload)
      : this.movService.criar(payload);

    obs.subscribe({
      next: () => {
        this.saving = false;
        this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Movimentação salva.' });
        this.closeDialog();
        this.loadMovimentacoes();
      },
      error: (err) => {
        this.saving = false;
        const detail = err?.error?.message || 'Erro ao salvar movimentação.';
        this.messageService.add({ severity: 'error', summary: 'Erro', detail });
      }
    });
  }

  editar(m: EstoqueMovimentacao): void {
    this.editingId = m.id;
    const unit = m.quantidade ? m.valor / m.quantidade : 0;
    this.form.patchValue({
      id_produto: m.idProduto,
      tipo: m.tipo,
      quantidade: m.quantidade,
      valor: this.formatCurrencyBR(unit),
      observacao: m.observacao || ''
    });
    this.valorNumerico = unit;
    this.dialogVisible = true;
  }

  remover(m: EstoqueMovimentacao): void {
    this.movService.remover(m.id).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Movimentação excluída.' });
        this.loadMovimentacoes();
      },
      error: (err) => {
        const detail = err?.error?.message || 'Erro ao excluir movimentação.';
        this.messageService.add({ severity: 'error', summary: 'Erro', detail });
      }
    });
  }

  private loadProdutos(): void {
    this.produtoService.listar().subscribe({
      next: (data: Produto[]) => {
        this.produtoOptions = (data || []).map((p) => ({ label: p.nome, value: p.id }));
      },
      error: () => {
        this.produtoOptions = [];
      }
    });
  }

  private loadMovimentacoes(): void {
    this.loading = true;
    this.movService.listar().subscribe({
      next: (data) => {
        this.movimentacoes = data || [];
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  get total(): number {
    const qtd = Number(this.form.value.quantidade) || 0;
    const val = this.valorNumerico || 0;
    return qtd * val;
  }

  onValorInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const apenasDigitos = input.value.replace(/[^\d]/g, '');
    const centavos = apenasDigitos ? parseInt(apenasDigitos, 10) : 0;
    const valor = centavos / 100;
    this.valorNumerico = valor;
    const formatado = this.formatCurrencyBR(valor);
    this.form.patchValue({ valor: formatado }, { emitEvent: false });
  }

  private formatCurrencyBR(value: number): string {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }
}
