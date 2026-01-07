import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

import { ProdutoService, Produto } from '../../../services/produto.service';
import { ClienteService, Cliente } from '../../../services/cliente.service';
import { LancamentoServicoService, LancamentoServicoPayload, LancamentoServico } from '../../../services/lancamento-servico.service';
import { EstoqueMovimentacaoService } from '../../../services/estoque-movimentacao.service';

type ItemForm = {
  id_produto: number | null;
  quantidade: number | null;
  valorUnitario: number | null;
  valor: number | null;
};

@Component({
  selector: 'app-lancamentos-servicos',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule, DialogModule, InputTextModule, ButtonModule, ToastModule],
  providers: [MessageService],
  template: `
    <section class="page">
      <p-toast></p-toast>
      <header class="page-header">
        <div>
          <p class="eyebrow">Lançamentos</p>
          <h1>Lançamentos Serviços</h1>
        </div>
        <button pButton label="Novo serviço" icon="pi pi-plus" class="btn-primary" (click)="openDialog()"></button>
      </header>

      <div class="card">
        <p *ngIf="loading">Carregando...</p>
        <p *ngIf="!loading && servicos.length === 0">Nenhum lançamento de serviço.</p>
        <table *ngIf="!loading && servicos.length > 0" class="simple-table">
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Descrição</th>
              <th>Observação</th>
              <th>Data</th>
              <th style="width: 140px;">Ações</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let s of servicos">
              <td>{{ s.cliente || s.idCliente }}</td>
              <td>{{ s.descricao }}</td>
              <td>{{ s.observacao || '-' }}</td>
              <td>{{ s.dataLancamento | date:'dd/MM/yyyy HH:mm' }}</td>
              <td class="actions">
                <button pButton type="button" icon="pi pi-search" class="p-button-text" (click)="verItens(s)"></button>
                <button pButton type="button" icon="pi pi-pencil" class="p-button-text" (click)="editar(s)"></button>
                <button pButton type="button" icon="pi pi-trash" class="p-button-text p-button-danger" (click)="remover(s)"></button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <p-dialog
        header="Novo lançamento de serviço"
        [(visible)]="dialogVisible"
        [modal]="true"
        [style]="{ width: '720px' }"
        [closable]="false"
      >
        <form [formGroup]="form" class="dialog-form">
          <div class="field">
            <label>Cliente</label>
            <div class="prefix-input readonly-box">
              <span>{{ clienteSelecionado?.nomeRazaoSocial || 'Selecione um cliente' }}</span>
              <button pButton type="button" label="Buscar" class="p-button-text" (click)="openClienteModal()"></button>
            </div>
            <small *ngIf="form.get('id_cliente')?.invalid && form.get('id_cliente')?.touched" class="error">
              Informe o cliente.
            </small>
          </div>

          <div class="field">
            <label for="descricao">Descrição</label>
            <input id="descricao" type="text" pInputText formControlName="descricao" placeholder="Ex: Troca de 2 pneus" />
            <small *ngIf="form.get('descricao')?.invalid && form.get('descricao')?.touched" class="error">
              Informe a descrição.
            </small>
          </div>

          <div class="field">
            <label for="observacao">Observação</label>
            <textarea id="observacao" rows="3" class="p-inputtext p-component" formControlName="observacao" placeholder="Opcional"></textarea>
          </div>

          <div class="items-header">
            <h3>Itens do serviço</h3>
            <button pButton type="button" icon="pi pi-plus" label="Adicionar item" class="p-button-text" (click)="addItem()"></button>
          </div>

          <div class="items-list" formArrayName="itens">
            <div class="item-row" *ngFor="let item of itens.controls; index as i" [formGroupName]="i">
              <div class="field full-row">
                <label>Produto</label>
                <select formControlName="id_produto" class="p-inputtext p-component" (change)="onProdutoChange(i)">
                  <option [ngValue]="null" disabled selected>Selecione</option>
                  <option *ngFor="let p of produtosOptions" [ngValue]="p.value">{{ p.label }}</option>
                </select>
                <small class="info" *ngIf="(itens.at(i)?.value?.id_produto) as pid">
                  Em estoque: {{ saldoMap[pid] || 0 }}
                </small>
              </div>
              <div class="field">
                <label>Qtd</label>
                <input type="number" min="0" step="0.001" pInputText formControlName="quantidade" (input)="onQuantidadeChange(i)" />
              </div>
              <div class="field">
                <label>Valor</label>
                <input type="hidden" formControlName="valor" />
                <div class="prefix-input readonly-box">
                  <span>R$</span>
                  <span>{{ displayValor(i) }}</span>
                </div>
              </div>
              <div class="field actions-inline">
                <button pButton type="button" icon="pi pi-trash" class="p-button-text p-button-danger" (click)="removeItem(i)"></button>
              </div>
            </div>
          </div>

          <div class="dialog-actions">
            <button pButton type="button" label="Cancelar" class="p-button-text" (click)="closeDialog()"></button>
            <button pButton type="button" label="Salvar" [disabled]="form.invalid || itens.length === 0" (click)="salvar()"></button>
          </div>
        </form>
      </p-dialog>

      <p-dialog
        header="Pesquisar cliente"
        [(visible)]="clienteModalVisible"
        [modal]="true"
        [style]="{ width: '720px' }"
        [closable]="true"
      >
        <div class="card">
          <table class="simple-table" *ngIf="clientesLista.length > 0; else semCli">
            <thead>
              <tr>
                <th>Nome / Razão social</th>
                <th>Fantasia</th>
                <th>CPF/CNPJ</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let c of clientesLista" [class.selected]="clienteSelecionado?.id === c.id">
                <td>{{ c.nomeRazaoSocial }}</td>
                <td>{{ c.nomeFantasia || '-' }}</td>
                <td>{{ c.cpfCnpj }}</td>
                <td class="actions">
                  <button pButton type="button" label="Selecionar" class="p-button-text" (click)="selecionarCliente(c)"></button>
                </td>
              </tr>
            </tbody>
          </table>
          <ng-template #semCli>
            <p>Nenhum cliente encontrado.</p>
          </ng-template>
        </div>
        <div class="dialog-actions">
          <button pButton type="button" label="Fechar" class="p-button-text" (click)="clienteModalVisible = false"></button>
          <button pButton type="button" label="Adicionar" [disabled]="!clienteSelecionado" (click)="aplicarCliente()"></button>
        </div>
      </p-dialog>

      <p-dialog
        header="Itens do serviço"
        [(visible)]="dialogViewVisible"
        [modal]="true"
        [style]="{ width: '700px' }"
        [closable]="true"
      >
        <div *ngIf="currentView as view">
            <p><strong>Descrição:</strong> {{ view.descricao }}</p>
          <p><strong>Observação:</strong> {{ view.observacao || '-' }}</p>
          <p><strong>Data:</strong> {{ view.dataLancamento | date:'dd/MM/yyyy HH:mm' }}</p>
          <table class="simple-table" *ngIf="view.itens?.length">
            <thead>
              <tr>
                <th>Produto</th>
                <th>Qtd</th>
                <th>Valor (unit)</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let it of view.itens">
                <td>{{ it.produto || it.idProduto }}</td>
                <td>{{ it.quantidade }}</td>
                <td>{{ it.valor | currency: 'BRL':'symbol':'1.2-2' }}</td>
                <td>{{ (it.valor * it.quantidade) | currency: 'BRL':'symbol':'1.2-2' }}</td>
              </tr>
            </tbody>
          </table>
          <p *ngIf="!view.itens?.length">Sem itens.</p>
        </div>
      </p-dialog>
    </section>
  `,
  styles: [`
    .page {
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
    h3 {
      margin: 0;
      color: #0f172a;
      font-size: 1rem;
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
    .card {
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
    textarea {
      resize: vertical;
    }
    .dialog-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem;
    }
    .items-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: 0.25rem;
    }
    .items-list {
      display: grid;
      gap: 0.75rem;
    }
    .item-row {
      display: grid;
      grid-template-columns: 1fr 1fr auto;
      gap: 0.5rem;
      padding: 0.5rem;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      background: #f8fafc;
    }
    .item-row .full-row {
      grid-column: 1 / -1;
    }
    .item-row .field {
      min-width: 0;
    }
    .item-row .field select,
    .item-row .field input {
      width: 100%;
      box-sizing: border-box;
    }
    .actions-inline {
      display: flex;
      align-items: end;
      justify-content: flex-end;
    }
    .actions {
      display: flex;
      gap: 0.35rem;
    }
    .error {
      color: #ef4444;
      font-size: 0.82rem;
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
    .prefix-input span {
      font-weight: 600;
      color: #111827;
    }
    .prefix-input input {
      border: none;
      flex: 1;
      background: transparent;
      outline: none;
    }
    .prefix-input button {
      margin-left: auto;
    }
    .simple-table tr.selected {
      background: #e0f7f6;
    }
    .readonly-box {
      width: 100%;
      justify-content: flex-start;
    }
  `]
})
export class LancamentosServicosComponent implements OnInit {
  servicos: LancamentoServico[] = [];
  produtosOptions: { label: string; value: number }[] = [];
  clientesLista: Cliente[] = [];
  clienteSelecionado: Cliente | null = null;
  clienteModalVisible = false;
  dialogVisible = false;
  dialogViewVisible = false;
  loading = false;
  saving = false;
  form!: FormGroup;
  editingId: number | null = null;
  currentView: LancamentoServico | null = null;
  saldoMap: Record<number, number> = {};

  constructor(
    private fb: FormBuilder,
    private produtoService: ProdutoService,
    private estoqueMovService: EstoqueMovimentacaoService,
    private lancamentoServicoService: LancamentoServicoService,
    private clienteService: ClienteService,
    private messageService: MessageService
  ) {
    this.form = this.fb.group({
      id_cliente: [null, Validators.required],
      descricao: ['', [Validators.required, Validators.maxLength(150)]],
      observacao: [''],
      itens: this.fb.array([])
    });
  }

  ngOnInit(): void {
    this.loadProdutos();
    this.loadServicos();
  }

  get itens(): FormArray {
    return this.form.get('itens') as FormArray;
  }

  openDialog(): void {
    this.dialogVisible = true;
  }

  closeDialog(): void {
    this.dialogVisible = false;
    this.dialogViewVisible = false;
    this.currentView = null;
    this.form.reset({ id_cliente: null, descricao: '', observacao: '' });
    this.itens.clear();
    this.editingId = null;
    this.clienteSelecionado = null;
  }

  addItem(): void {
    const group = this.fb.group({
      id_produto: [null, Validators.required],
      quantidade: [0, [Validators.required, Validators.min(0)]],
      valorUnitario: [0, [Validators.min(0)]],
      valor: [0, [Validators.required, Validators.min(0)]]
    });
    this.itens.push(group);
  }

  removeItem(index: number): void {
    this.itens.removeAt(index);
  }

  onProdutoChange(index: number): void {
    const group = this.itens.at(index) as FormGroup;
    const idProd = group.value.id_produto;
    if (!idProd) return;
    this.estoqueMovService.ultimoValor(idProd).subscribe({
      next: (res) => {
        const valorUnitario = res?.valor ?? 0;
        const quantidade = Number(group.value.quantidade) || 1;
        group.patchValue({
          quantidade,
          valorUnitario,
          valor: quantidade * valorUnitario
        });
      },
      error: () => {}
    });
    this.estoqueMovService.saldo(idProd).subscribe({
      next: (res) => {
        this.saldoMap[idProd] = res?.quantidade ?? 0;
      },
      error: () => {}
    });
  }

  formatCurrencyBR(value: number | null | undefined, withSymbol: boolean = true): string {
    const num = Number(value) || 0;
    const formatted = num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    return withSymbol ? formatted : formatted.replace('R$', '').trim();
  }

  displayValor(index: number): string {
    const ctrl = this.itens.at(index);
    const val = ctrl ? Number((ctrl as FormGroup).value?.valor ?? 0) : 0;
    return this.formatCurrencyBR(val, false);
  }

  onQuantidadeChange(index: number): void {
    const group = this.itens.at(index) as FormGroup;
    const quantidade = Number(group.value.quantidade) || 0;
    const valorUnitario = Number(group.value.valorUnitario) || 0;
    group.patchValue({ valor: quantidade * valorUnitario });
  }

  salvar(): void {
    if (this.form.invalid || this.itens.length === 0) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving = true;
    const payload: LancamentoServicoPayload = {
      idCliente: this.form.value.id_cliente,
      descricao: this.form.value.descricao,
      observacao: this.form.value.observacao,
      itens: this.itens.value.map((i: any) => ({
        idProduto: i.id_produto,
        quantidade: Number(i.quantidade) || 0,
        valor: Number(i.valorUnitario ?? i.valor) || 0
      }))
    };

    const obs = this.editingId
      ? this.lancamentoServicoService.atualizar(this.editingId, payload)
      : this.lancamentoServicoService.criar(payload);

    obs.subscribe({
      next: () => {
        this.saving = false;
        this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Serviço lançado.' });
        this.closeDialog();
        this.loadServicos();
      },
      error: (err) => {
        this.saving = false;
        const detail = err?.error?.message || 'Erro ao salvar';
        this.messageService.add({ severity: 'error', summary: 'Erro', detail });
      }
    });
  }

  verItens(s: LancamentoServico): void {
    this.lancamentoServicoService.obter(s.id).subscribe({
      next: (data) => {
        this.currentView = data;
        this.dialogViewVisible = true;
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Não foi possível carregar itens.' });
      }
    });
  }

  editar(s: LancamentoServico): void {
    this.lancamentoServicoService.obter(s.id).subscribe({
      next: (data) => {
        this.editingId = data.id;
        this.form.patchValue({
          id_cliente: data.idCliente,
          descricao: data.descricao,
          observacao: data.observacao || ''
        });
        if (data.idCliente) {
          this.loadClienteById(data.idCliente);
        } else {
          this.clienteSelecionado = null;
        }
        this.itens.clear();
        (data.itens || []).forEach((it) => {
          const group = this.fb.group({
            id_produto: [it.idProduto, Validators.required],
            quantidade: [it.quantidade, [Validators.required, Validators.min(0)]],
            valorUnitario: [it.valor, [Validators.min(0)]],
            valor: [(it.valor || 0) * (it.quantidade || 0), [Validators.required, Validators.min(0)]]
          });
          this.itens.push(group);
          this.saldoMap[it.idProduto] = 0;
        });
        this.dialogVisible = true;
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Não foi possível carregar o serviço.' });
      }
    });
  }

  remover(s: LancamentoServico): void {
    const ok = confirm(`Excluir lançamento "${s.descricao}"?`);
    if (!ok) return;
    this.lancamentoServicoService.remover(s.id).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Lançamento excluído.' });
        this.loadServicos();
      },
      error: (err) => {
        const detail = err?.error?.message || 'Erro ao excluir.';
        this.messageService.add({ severity: 'error', summary: 'Erro', detail });
      }
    });
  }

  private loadServicos(): void {
    this.loading = true;
    this.lancamentoServicoService.listar().subscribe({
      next: (data) => {
        this.servicos = data || [];
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  openClienteModal(): void {
    this.clienteModalVisible = true;
    this.loadClientes();
  }

  private loadClientes(): void {
    this.clienteService.listar().subscribe({
      next: (data) => (this.clientesLista = data || []),
      error: () => (this.clientesLista = [])
    });
  }

  private loadClienteById(id: number): void {
    this.clienteService.obter(id).subscribe({
      next: (cli) => (this.clienteSelecionado = cli),
      error: () => (this.clienteSelecionado = { id, nomeRazaoSocial: `Cliente #${id}` } as Cliente)
    });
  }

  selecionarCliente(cli: Cliente): void {
    this.clienteSelecionado = cli;
  }

  aplicarCliente(): void {
    if (!this.clienteSelecionado) return;
    this.form.patchValue({ id_cliente: this.clienteSelecionado.id });
    this.clienteModalVisible = false;
  }
  private loadProdutos(): void {
    this.produtoService.listarComEntrada().subscribe({
      next: (data: Produto[]) => {
        this.produtosOptions = (data || []).map((p) => ({ label: p.nome, value: p.id }));
      },
      error: () => {
        this.produtosOptions = [];
      }
    });
  }
}

