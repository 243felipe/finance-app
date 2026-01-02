import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { CheckboxModule } from 'primeng/checkbox';
import { TextareaModule } from 'primeng/textarea';
import { MessageService } from 'primeng/api';

import { LancamentoFinanceiroService } from '../../../services/lancamento-financeiro.service';
import { FinancialCategoryService } from '../../../services/financial-category.service';
import { FormaPagamentoService } from '../../../services/forma-pagamento.service';
import { FixedAccountService } from '../../../services/fixed-account.service';

type ContaPagar = {
  id: number;
  descricao: string;
  valor: number;
  dataPagamento?: string | null;
  dataVencimento?: string | null;
  categoria?: string;
  contaFixa?: string;
  formaPagamento?: string;
  idContaFixa?: number | null;
  observacao?: string;
  criadoEm?: string;
  statusPagamento: string;
};

@Component({
  selector: 'app-contas-a-pagar',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    SelectModule,
    DatePickerModule,
    CheckboxModule,
    TextareaModule
  ],
  templateUrl: './contas-a-pagar.component.html',
  styleUrls: ['./contas-a-pagar.component.scss']
})
export class ContasAPagarComponent implements OnInit {
  form!: FormGroup;
  itens: ContaPagar[] = [];
  loading = false;
  saving = false;

  categorias: any[] = [];
  formasPagamento: any[] = [];
  contasFixas: any[] = [];

  constructor(
    private fb: FormBuilder,
    private lancamentoService: LancamentoFinanceiroService,
    private categoriaService: FinancialCategoryService,
    private formaPagamentoService: FormaPagamentoService,
    private contaFixaService: FixedAccountService,
    private messageService: MessageService
  ) {
    this.form = this.fb.group({
      descricao: ['', [Validators.required, Validators.minLength(3)]],
      idCategoria: [null, [Validators.required]],
      valor: [0, [Validators.required, Validators.min(0.01)]],
      dataVencimento: [null],
      dataPagamento: [null],
      idFormaPagamento: [null],
      isContaFixa: [false],
      idContaFixa: [null],
      observacao: ['']
    });
  }

  ngOnInit(): void {
    this.carregarListas();
    this.carregar();
  }

  carregar(): void {
    this.loading = true;
    this.lancamentoService.listContasAPagar().subscribe({
      next: (data) => {
        this.itens = data.map((d) => ({
          ...d,
          statusPagamento: d.statusPagamento || (d.dataPagamento ? 'PAGA' : 'EM ABERTO')
        }));
        this.loading = false;
      },
      error: (err) => {
        console.error('Erro ao listar contas a pagar', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: 'Não foi possível carregar as contas a pagar.'
        });
        this.loading = false;
      }
    });
  }

  salvar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.value;
    if (v.isContaFixa && !v.idContaFixa) {
      this.messageService.add({ severity: 'warn', summary: 'Conta fixa', detail: 'Selecione a conta fixa.' });
      return;
    }
    this.saving = true;
    const hoje = new Date();
    const toStr = (d: Date) => d.toISOString().slice(0, 10);

    const payload: any = {
      dataLancamento: v.dataPagamento ? toStr(new Date(v.dataPagamento)) : toStr(hoje),
      dataVencimento: v.dataVencimento ? toStr(new Date(v.dataVencimento)) : null,
      dataPagamento: v.dataPagamento ? toStr(new Date(v.dataPagamento)) : null,
      descricao: v.descricao,
      tipo: 'S',
      valor: v.valor,
      idCategoria: v.idCategoria,
      idContaFixa: v.isContaFixa ? v.idContaFixa : null,
      idFormaPagamento: v.idFormaPagamento ?? null,
      observacao: v.observacao || ''
    };

    this.lancamentoService.create(payload).subscribe({
      next: () => {
        this.saving = false;
        this.messageService.add({ severity: 'success', summary: 'Salvo', detail: 'Conta a pagar registrada.' });
        this.form.reset({ valor: 0, isContaFixa: false });
        this.carregar();
      },
      error: (err) => {
        console.error('Erro ao salvar conta a pagar', err);
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Não foi possível salvar.' });
        this.saving = false;
      }
    });
  }

  private carregarListas(): void {
    this.categoriaService.list().subscribe({ next: (d) => (this.categorias = d) });
    this.formaPagamentoService.list().subscribe({ next: (d) => (this.formasPagamento = d) });
    this.contaFixaService.list().subscribe({ next: (d) => (this.contasFixas = d) });
  }
}

