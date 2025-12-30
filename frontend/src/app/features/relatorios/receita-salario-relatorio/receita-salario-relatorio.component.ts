import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';

import { LancamentoFinanceiro } from '../../../models/lancamento-financeiro';
import { LancamentoFinanceiroService } from '../../../services/lancamento-financeiro.service';
import { PdfService } from '../../../services/pdf.service';

@Component({
  selector: 'app-receita-salario-relatorio',
  standalone: true,
  imports: [CommonModule, FormsModule, TableModule, ButtonModule, DatePickerModule],
  templateUrl: './receita-salario-relatorio.component.html',
  styleUrls: ['./receita-salario-relatorio.component.scss']
})
export class ReceitaSalarioRelatorioComponent implements OnInit {
  dataInicio: Date | null = null;
  dataFim: Date | null = null;
  loading = false;
  dados: LancamentoFinanceiro[] = [];

  pt: any = {
    firstDayOfWeek: 0,
    dayNames: ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'],
    dayNamesShort: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'],
    dayNamesMin: ['Do', 'Se', 'Te', 'Qu', 'Qu', 'Se', 'Sa'],
    monthNames: ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'],
    monthNamesShort: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
    today: 'Hoje',
    clear: 'Limpar'
  };

  constructor(
    private service: LancamentoFinanceiroService,
    private pdfService: PdfService
  ) {
    // Define período padrão: mês atual
    const hoje = new Date();
    const inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const fim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
    this.dataInicio = inicio;
    this.dataFim = fim;
  }

  ngOnInit(): void {
    this.pesquisar();
  }

  pesquisar(): void {
    if (!this.dataInicio || !this.dataFim) {
      alert('Por favor, selecione o período de datas');
      return;
    }

    this.loading = true;
    const params = {
      dataInicio: this.formatarDataParaAPI(this.dataInicio),
      dataFim: this.formatarDataParaAPI(this.dataFim),
      tipo: 'E',
      idFonteRenda: undefined
    };

    this.service.listByDateRange(params).subscribe({
      next: (data) => {
        // Filtrar apenas receitas de salário (geralmente tem fonte de renda)
        this.dados = data.filter(l => l.idFonteRenda !== null && l.idFonteRenda !== undefined);
        this.loading = false;
      },
      error: (err) => {
        console.error('Erro ao carregar dados', err);
        this.loading = false;
      }
    });
  }

  gerarPdf(): void {
    if (this.dados.length === 0) {
      alert('Não há dados para gerar o relatório');
      return;
    }

    const periodo = `${this.formatarDataParaExibicao(this.dataInicio!)} a ${this.formatarDataParaExibicao(this.dataFim!)}`;
    const titulo = `Relatório de Receita - Salário - ${periodo}`;

    const colunas = [
      { campo: 'dataLancamento', label: 'Data', formatar: (v: string) => this.formatarData(v) },
      { campo: 'descricao', label: 'Descrição' },
      { campo: 'fonteRenda', label: 'Fonte de Renda' },
      { campo: 'categoria', label: 'Categoria' },
      { campo: 'valor', label: 'Valor', formatar: (v: number) => this.formatarMoeda(v) }
    ];

    this.pdfService.gerarPdf(titulo, this.dados, colunas);
  }

  visualizarPdf(): void {
    if (this.dados.length === 0) {
      alert('Não há dados para visualizar o relatório');
      return;
    }

    const periodo = `${this.formatarDataParaExibicao(this.dataInicio!)} a ${this.formatarDataParaExibicao(this.dataFim!)}`;
    const titulo = `Relatório de Receita - Salário - ${periodo}`;

    const colunas = [
      { campo: 'dataLancamento', label: 'Data', formatar: (v: string) => this.formatarData(v) },
      { campo: 'descricao', label: 'Descrição' },
      { campo: 'fonteRenda', label: 'Fonte de Renda' },
      { campo: 'categoria', label: 'Categoria' },
      { campo: 'valor', label: 'Valor', formatar: (v: number) => this.formatarMoeda(v) }
    ];

    this.pdfService.visualizarPdf(titulo, this.dados, colunas);
  }

  formatarData(data: string): string {
    if (!data) return '-';
    const d = new Date(data);
    return d.toLocaleDateString('pt-BR');
  }

  formatarDataParaExibicao(data: Date | string): string {
    if (!data) return '';
    const d = data instanceof Date ? data : new Date(data);
    return d.toLocaleDateString('pt-BR');
  }

  formatarDataParaAPI(data: Date): string {
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const dia = String(data.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
  }

  formatarMoeda(valor: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  }

  get total(): number {
    return this.dados.reduce((sum, item) => sum + item.valor, 0);
  }
}

