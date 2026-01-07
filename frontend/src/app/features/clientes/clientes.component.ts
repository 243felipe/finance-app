import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

import { ClienteService, Cliente, ClientePayload, ClienteHistorico } from '../../services/cliente.service';
import { FormaPagamentoService } from '../../services/forma-pagamento.service';

@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule, DialogModule, InputTextModule, ButtonModule, ToastModule],
  providers: [MessageService],
  template: `
    <section class="page">
      <p-toast></p-toast>

      <header class="page-header">
        <div>
          <p class="eyebrow">Clientes</p>
          <h1>Cadastro de Clientes</h1>
        </div>
        <div class="actions">
          <button pButton label="Novo cliente" icon="pi pi-plus" class="btn-primary" (click)="openCreate()"></button>
        </div>
      </header>

      <div class="card filters">
        <form [formGroup]="filterForm" class="filter-grid" (ngSubmit)="applyFilters()">
          <div class="field">
            <label>Nome / Razão social</label>
            <input type="text" pInputText formControlName="nome" placeholder="Ex: João da Silva" />
          </div>
          <div class="field">
            <label>Empresa / CNPJ</label>
            <input type="text" pInputText formControlName="empresa" placeholder="Ex: Borracharia XPTO" />
          </div>
          <div class="filter-actions">
            <button pButton type="button" class="p-button-text" label="Limpar" (click)="clearFilters()"></button>
            <button pButton type="submit" label="Filtrar" icon="pi pi-search"></button>
          </div>
        </form>
      </div>

      <div class="card">
        <p *ngIf="loading">Carregando clientes...</p>
        <p *ngIf="!loading && clientes.length === 0">Nenhum cliente encontrado.</p>
        <table *ngIf="!loading && clientes.length > 0" class="simple-table">
          <thead>
            <tr>
              <th>Nome / Razão social</th>
              <th>Fantasia</th>
              <th>Tipo</th>
              <th>Documento</th>
              <th>Contato</th>
              <th>E-mail</th>
              <th>Status</th>
              <th style="width: 180px;">Ações</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let c of clientes">
              <td>{{ c.nomeRazaoSocial }}</td>
              <td>{{ c.nomeFantasia || '-' }}</td>
              <td>{{ c.tipoCliente }}</td>
              <td>{{ c.cpfCnpj }}</td>
              <td>{{ c.telefonePrincipal || c.whatsapp || '-' }}</td>
              <td>{{ c.email || '-' }}</td>
              <td>
                <span class="badge" [class.badge-green]="c.ativo" [class.badge-red]="!c.ativo">
                  {{ c.ativo ? 'Ativo' : 'Inativo' }}
                </span>
              </td>
              <td class="actions">
                <button pButton type="button" icon="pi pi-clock" class="p-button-text" (click)="openHistorico(c)"></button>
                <button pButton type="button" icon="pi pi-pencil" class="p-button-text" (click)="openEdit(c)"></button>
                <button pButton type="button" icon="pi pi-trash" class="p-button-text p-button-danger" (click)="remover(c)"></button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <p-dialog
        header="{{ editingId ? 'Editar cliente' : 'Novo cliente' }}"
        [(visible)]="dialogVisible"
        [modal]="true"
        [style]="{ width: '760px' }"
        [closable]="false"
      >
        <form [formGroup]="form" class="dialog-form">
          <div class="stepper">
            <div class="step" [class.active]="step === 1">
              <span>1</span>
              <p>Identificação</p>
            </div>
            <div class="step" [class.active]="step === 2">
              <span>2</span>
              <p>Contato & Endereço</p>
            </div>
            <div class="step" [class.active]="step === 3">
              <span>3</span>
              <p>Informações</p>
            </div>
          </div>

          <ng-container [ngSwitch]="step">
            <div *ngSwitchCase="1" class="grid-form">
              <div class="field">
                <label>Tipo de cliente</label>
                <select pInputText formControlName="tipoCliente">
                  <option value="PF">Pessoa Física</option>
                  <option value="PJ">Pessoa Jurídica</option>
                </select>
              </div>
              <div class="field full-row">
                <label>Nome / Razão social</label>
                <input type="text" pInputText formControlName="nomeRazaoSocial" />
              </div>
              <div class="field full-row">
                <label>Nome fantasia</label>
                <input type="text" pInputText formControlName="nomeFantasia" />
              </div>
              <div class="field">
                <label>CPF / CNPJ</label>
                <input type="text" pInputText formControlName="cpfCnpj" (input)="onCpfCnpjInput()" />
              </div>
              <div class="field">
                <label>RG / Inscrição Estadual</label>
                <input type="text" pInputText formControlName="rgIe" />
              </div>
              <div class="field">
                <label>Status</label>
                <select pInputText formControlName="ativo">
                  <option [ngValue]="true">Ativo</option>
                  <option [ngValue]="false">Inativo</option>
                </select>
              </div>
            </div>

            <div *ngSwitchCase="2" class="grid-form">
              <div class="field">
                <label>Telefone principal</label>
                <input type="text" pInputText formControlName="telefonePrincipal" (input)="onTelefoneInput('telefonePrincipal')" />
              </div>
              <div class="field">
                <label>Telefone secundário</label>
                <input type="text" pInputText formControlName="telefoneSecundario" (input)="onTelefoneInput('telefoneSecundario')" />
              </div>
              <div class="field">
                <label>WhatsApp</label>
                <input type="text" pInputText formControlName="whatsapp" (input)="onTelefoneInput('whatsapp')" />
              </div>
              <div class="field">
                <label>E-mail</label>
                <input type="email" pInputText formControlName="email" />
              </div>
              <div class="field">
                <label>CEP</label>
                <input type="text" pInputText formControlName="cep" (input)="onCepInput()" />
              </div>
              <div class="field full-row">
                <label>Logradouro</label>
                <input type="text" pInputText formControlName="logradouro" />
              </div>
              <div class="field">
                <label>Número</label>
                <input type="text" pInputText formControlName="numero" />
              </div>
              <div class="field">
                <label>Complemento</label>
                <input type="text" pInputText formControlName="complemento" />
              </div>
              <div class="field">
                <label>Bairro</label>
                <input type="text" pInputText formControlName="bairro" />
              </div>
              <div class="field">
                <label>Cidade</label>
                <input type="text" pInputText formControlName="cidade" />
              </div>
              <div class="field">
                <label>Estado</label>
                <input type="text" pInputText formControlName="estado" maxlength="2" />
              </div>
            </div>

            <div *ngSwitchCase="3" class="grid-form">
              <div class="field">
                <label>Tipo de cliente (borracharia)</label>
                <select pInputText formControlName="tipoClienteBorracharia">
                  <option value="Avulso">Avulso</option>
                  <option value="Frotista">Frotista</option>
                  <option value="Empresa">Empresa</option>
                </select>
              </div>
              <div class="field">
                <label>Limite de crédito</label>
                <input type="number" min="0" step="0.01" pInputText formControlName="limiteCredito" />
              </div>
              <div class="field">
                <label>Forma de pagamento padrão</label>
                <select pInputText formControlName="formaPagamentoPadrao">
                  <option [ngValue]="''" disabled selected>Selecione</option>
                  <option *ngFor="let fp of formaPagamentoOptions" [ngValue]="fp.value">{{ fp.label }}</option>
                </select>
              </div>
              <div class="field full-row">
                <label>Observações</label>
                <textarea rows="3" class="p-inputtext p-component" formControlName="observacoes"></textarea>
              </div>
            </div>
          </ng-container>

          <div class="dialog-actions spaced">
            <button pButton type="button" label="Voltar" class="p-button-text" (click)="prev()" [disabled]="step === 1"></button>
            <div class="inline-actions">
              <button pButton type="button" label="Avançar" (click)="next()" *ngIf="step < 3"></button>
              <button pButton type="button" label="Salvar" icon="pi pi-check" (click)="salvar()" [disabled]="form.invalid" *ngIf="step === 3"></button>
            </div>
          </div>
        </form>
      </p-dialog>

      <p-dialog
        header="Histórico do cliente"
        [(visible)]="historicoVisible"
        [modal]="true"
        [style]="{ width: '1100px' }"
        [closable]="true"
        (onHide)="historicoCliente = null"
      >
        <div *ngIf="historicoCliente" class="history-grid">
          <div class="history-left card">
            <h3>{{ historicoCliente.nomeRazaoSocial }}</h3>
            <p class="muted">CPF/CNPJ: {{ historicoCliente.cpfCnpj }}</p>

            <h4>Adicionar evento</h4>
            <form [formGroup]="historicoForm" class="history-form" (ngSubmit)="adicionarHistorico()">
              <div class="field">
                <label>Tipo de evento</label>
                <select pInputText formControlName="tipoEvento">
                  <option *ngFor="let t of tiposEvento" [value]="t.value">{{ t.label }}</option>
                </select>
              </div>
              <div class="field">
                <label>Descrição</label>
                <textarea rows="5" class="p-inputtext p-component" formControlName="descricao" placeholder="Opcional"></textarea>
              </div>
              <div class="history-actions">
                <button pButton type="submit" label="Registrar" icon="pi pi-plus" [disabled]="historicoForm.invalid || adicionandoHistorico"></button>
              </div>
            </form>
          </div>

          <div class="history-right card">
            <h4>Registros</h4>
            <div class="history-list" *ngIf="historicos.length > 0; else emptyHistory">
              <div class="history-item" *ngFor="let h of historicos">
                <div>
                  <p class="history-title">{{ h.tipoEvento }}</p>
                  <p class="history-desc">{{ h.descricao || '-' }}</p>
                </div>
                <span class="history-date">{{ h.dataEvento | date:'dd/MM/yyyy HH:mm' }}</span>
              </div>
            </div>
            <ng-template #emptyHistory>
              <p class="muted">Nenhum evento registrado.</p>
            </ng-template>
          </div>
        </div>
      </p-dialog>
    </section>
  `,
  styles: [`
    .page { padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem; }
    .page-header { display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
    .eyebrow { margin: 0; color: #6b7280; text-transform: uppercase; letter-spacing: 0.08em; font-size: 0.8rem; }
    h1 { margin: 0; color: #111827; font-size: 1.5rem; }
    .card { padding: 1rem; border: 1px solid #e2e8f0; border-radius: 10px; background: #f8fafc; color: #475569; }
    .filters .filter-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 0.75rem; align-items: end; }
    .filter-actions { display: flex; gap: 0.5rem; justify-content: flex-end; }
    .field { display: grid; gap: 0.35rem; }
    label { font-weight: 600; color: #111827; }
    .simple-table { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
    .simple-table th, .simple-table td { border: 1px solid #e2e8f0; padding: 0.5rem 0.6rem; text-align: left; color: #111827; }
    .simple-table thead { background: #f1f5f9; }
    .actions { display: flex; gap: 0.35rem; }
    .btn-primary { background: #00bab6; border: 1px solid #00bab6; color: #ffffff; }
    .btn-primary:hover { background: #0aa39f; border-color: #0aa39f; }
    .dialog-form { display: grid; gap: 0.75rem; }
    .grid-form { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 0.75rem; }
    .full-row { grid-column: 1 / -1; }
    .dialog-actions { display: flex; justify-content: flex-end; gap: 0.5rem; }
    .dialog-actions.spaced { justify-content: space-between; align-items: center; }
    .inline-actions { display: flex; gap: 0.5rem; }
    .badge { padding: 0.2rem 0.5rem; border-radius: 999px; font-size: 0.78rem; }
    .badge-green { background: #ecfdf3; color: #166534; }
    .badge-red { background: #fef2f2; color: #b91c1c; }
    .stepper { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.75rem; }
    .step { border: 1px solid #e2e8f0; border-radius: 8px; padding: 0.5rem; text-align: center; background: #f8fafc; color: #475569; }
    .step.active { border-color: #00bab6; color: #0f172a; background: #e0f7f6; }
    .step span { display: inline-flex; width: 28px; height: 28px; border-radius: 50%; align-items: center; justify-content: center; background: #e2e8f0; margin-bottom: 0.25rem; }
    .step.active span { background: #00bab6; color: #fff; }
    textarea { resize: vertical; }
    .muted { color: #6b7280; margin: 0.15rem 0; }
    .history-card { margin-bottom: 0.75rem; }
    .history-form { display: grid; gap: 0.5rem; }
    .history-actions { display: flex; justify-content: flex-end; }
    .history-list { display: grid; gap: 0.5rem; max-height: 360px; overflow: auto; }
    .history-item { border: 1px solid #e2e8f0; border-radius: 8px; padding: 0.6rem 0.8rem; display: flex; justify-content: space-between; gap: 0.5rem; background: #fff; }
    .history-title { margin: 0; font-weight: 700; color: #0f172a; }
    .history-desc { margin: 0.15rem 0 0; color: #475569; white-space: pre-line; }
    .history-date { color: #64748b; font-size: 0.85rem; }
    .history-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; align-items: start; }
    .history-left, .history-right { height: 100%; }
  `]
})
export class ClientesComponent implements OnInit {
  clientes: Cliente[] = [];
  historicos: ClienteHistorico[] = [];
  dialogVisible = false;
  historicoVisible = false;
  loading = false;
  saving = false;
  adicionandoHistorico = false;
  step = 1;
  editingId: number | null = null;
  historicoCliente: Cliente | null = null;

  filterForm: FormGroup;
  form: FormGroup;
  historicoForm: FormGroup;
  formaPagamentoOptions: { label: string; value: string }[] = [];

  tiposEvento = [
    { label: 'Compra', value: 'COMPRA' },
    { label: 'Ordem de Serviço', value: 'ORDEM_SERVICO' },
    { label: 'Recapagem', value: 'RECAPAGEM' },
    { label: 'Alteração cadastral', value: 'ALTERACAO_CADASTRAL' },
    { label: 'Observação', value: 'OBSERVACAO' }
  ];

  constructor(
    private fb: FormBuilder,
    private clienteService: ClienteService,
    private formaPagamentoService: FormaPagamentoService,
    private message: MessageService
  ) {
    this.filterForm = this.fb.group({
      nome: [''],
      empresa: ['']
    });

    this.form = this.fb.group({
      tipoCliente: ['PF', Validators.required],
      nomeRazaoSocial: ['', [Validators.required, Validators.maxLength(150)]],
      nomeFantasia: [''],
      cpfCnpj: ['', Validators.required],
      rgIe: [''],
      ativo: [true],
      telefonePrincipal: [''],
      telefoneSecundario: [''],
      whatsapp: [''],
      email: ['', Validators.email],
      cep: [''],
      logradouro: [''],
      numero: [''],
      complemento: [''],
      bairro: [''],
      cidade: [''],
      estado: [''],
      observacoes: [''],
      tipoClienteBorracharia: ['Avulso'],
      limiteCredito: [null],
      formaPagamentoPadrao: ['']
    });

    this.historicoForm = this.fb.group({
      tipoEvento: ['COMPRA', Validators.required],
      descricao: ['']
    });
  }

  ngOnInit(): void {
    this.loadClientes();
    this.loadFormasPagamento();
  }

  applyFilters(): void {
    this.loadClientes();
  }

  clearFilters(): void {
    this.filterForm.reset({ nome: '', empresa: '' });
    this.loadClientes();
  }

  private loadFormasPagamento(): void {
    this.formaPagamentoService.list().subscribe({
      next: (data) => {
        this.formaPagamentoOptions = (data || []).map((fp) => ({ label: fp.descricao, value: fp.descricao }));
      },
      error: () => {
        this.formaPagamentoOptions = [];
      }
    });
  }

  loadClientes(): void {
    this.loading = true;
    const { nome, empresa } = this.filterForm.value;
    this.clienteService.listar({ nome, empresa }).subscribe({
      next: (data) => {
        this.clientes = data || [];
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.message.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao carregar clientes' });
      }
    });
  }

  openCreate(): void {
    this.dialogVisible = true;
    this.editingId = null;
    this.step = 1;
    this.form.reset({
      tipoCliente: 'PF',
      nomeRazaoSocial: '',
      nomeFantasia: '',
      cpfCnpj: '',
      rgIe: '',
      ativo: true,
      telefonePrincipal: '',
      telefoneSecundario: '',
      whatsapp: '',
      email: '',
      cep: '',
      logradouro: '',
      numero: '',
      complemento: '',
      bairro: '',
      cidade: '',
      estado: '',
      observacoes: '',
      tipoClienteBorracharia: 'Avulso',
      limiteCredito: null,
      formaPagamentoPadrao: ''
    });
  }

  openEdit(cli: Cliente): void {
    this.editingId = cli.id;
    this.dialogVisible = true;
    this.step = 1;
    this.form.patchValue({
      ...cli
    });
  }

  next(): void {
    if (this.step < 3) {
      this.step += 1;
    }
  }

  prev(): void {
    if (this.step > 1) {
      this.step -= 1;
    }
  }

  salvar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving = true;
    const payload = this.form.value as ClientePayload;
    if (this.editingId) {
      this.clienteService.atualizar(this.editingId, payload).subscribe({
        next: () => this.onSaveSuccess(),
        error: (err: any) => this.onSaveError(err)
      });
    } else {
      this.clienteService.criar(payload).subscribe({
        next: () => this.onSaveSuccess(),
        error: (err: any) => this.onSaveError(err)
      });
    }
  }

  private onSaveSuccess(): void {
    this.saving = false;
    this.dialogVisible = false;
    this.message.add({ severity: 'success', summary: 'Sucesso', detail: 'Cliente salvo.' });
    this.loadClientes();
  }

  private onSaveError(err: any): void {
    this.saving = false;
    const detail = err?.error?.message || 'Erro ao salvar cliente';
    this.message.add({ severity: 'error', summary: 'Erro', detail });
  }

  onCpfCnpjInput(): void {
    const raw = this.onlyDigits(this.form.value.cpfCnpj || '');
    const masked = raw.length <= 11 ? this.maskCPF(raw) : this.maskCNPJ(raw);
    this.form.patchValue({ cpfCnpj: masked }, { emitEvent: false });
  }

  onTelefoneInput(field: 'telefonePrincipal' | 'telefoneSecundario' | 'whatsapp'): void {
    const raw = this.onlyDigits(this.form.value[field] || '');
    const masked = this.maskTelefone(raw);
    const patch: any = {};
    patch[field] = masked;
    this.form.patchValue(patch, { emitEvent: false });
  }

  onCepInput(): void {
    const raw = this.onlyDigits(this.form.value.cep || '').slice(0, 8);
    const masked = this.maskCEP(raw);
    this.form.patchValue({ cep: masked }, { emitEvent: false });
  }

  private onlyDigits(value: string): string {
    return (value || '').replace(/\D/g, '');
  }

  private maskCPF(value: string): string {
    const v = value.slice(0, 11);
    return v
      .replace(/^(\d{3})(\d)/, '$1.$2')
      .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3-$4');
  }

  private maskCNPJ(value: string): string {
    const v = value.slice(0, 14);
    return v
      .replace(/^(\d{2})(\d)/, '$1.$2')
      .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/^(\d{2})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3/$4')
      .replace(/^(\d{2})\.(\d{3})\.(\d{3})\/(\d{4})(\d)/, '$1.$2.$3/$4-$5');
  }

  private maskTelefone(value: string): string {
    const v = value.slice(0, 11);
    if (v.length <= 10) {
      return v
        .replace(/^(\d{2})(\d)/, '($1) $2')
        .replace(/^(\d{2})\s(\d{4})(\d)/, '($1) $2-$3');
    }
    return v
      .replace(/^(\d{2})(\d)/, '($1) $2')
      .replace(/^(\d{2})\s(\d{5})(\d)/, '($1) $2-$3');
  }

  private maskCEP(value: string): string {
    const v = value.slice(0, 8);
    return v.replace(/^(\d{5})(\d)/, '$1-$2');
  }

  remover(cli: Cliente): void {
    const ok = confirm(`Remover o cliente "${cli.nomeRazaoSocial}"?`);
    if (!ok) return;
    this.clienteService.remover(cli.id).subscribe({
      next: () => {
        this.message.add({ severity: 'success', summary: 'Sucesso', detail: 'Cliente removido.' });
        this.loadClientes();
      },
      error: () => {
        this.message.add({ severity: 'error', summary: 'Erro', detail: 'Não foi possível remover.' });
      }
    });
  }

  openHistorico(cli: Cliente): void {
    this.historicoCliente = cli;
    this.historicoVisible = true;
    this.historicoForm.reset({ tipoEvento: 'COMPRA', descricao: '' });
    this.clienteService.historico(cli.id).subscribe({
      next: (data) => (this.historicos = data || []),
      error: () => {
        this.historicos = [];
        this.message.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao carregar histórico' });
      }
    });
  }

  adicionarHistorico(): void {
    if (!this.historicoCliente || this.historicoForm.invalid) return;
    this.adicionandoHistorico = true;
    const { tipoEvento, descricao } = this.historicoForm.value;
    this.clienteService.adicionarHistorico(this.historicoCliente.id, { tipoEvento, descricao }).subscribe({
      next: (res) => {
        this.historicos = [res, ...this.historicos];
        this.adicionandoHistorico = false;
        this.historicoForm.reset({ tipoEvento: 'COMPRA', descricao: '' });
        this.message.add({ severity: 'success', summary: 'Registrado', detail: 'Evento adicionado.' });
      },
      error: () => {
        this.adicionandoHistorico = false;
        this.message.add({ severity: 'error', summary: 'Erro', detail: 'Não foi possível registrar evento.' });
      }
    });
  }
}

