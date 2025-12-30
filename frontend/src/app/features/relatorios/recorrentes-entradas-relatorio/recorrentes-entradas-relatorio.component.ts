import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';

import { LancamentoRecorrente } from '../../../models/lancamento-recorrente';
import { LancamentoRecorrenteService } from '../../../services/lancamento-recorrente.service';
import { PdfService } from '../../../services/pdf.service';

@Component({
  selector: 'app-recorrentes-entradas-relatorio',
  standalone: true,
  imports: [CommonModule, FormsModule, TableModule, ButtonModule],
  templateUrl: './recorrentes-entradas-relatorio.component.html',
  styleUrls: ['./recorrentes-entradas-relatorio.component.scss']
})
export class RecorrentesEntradasRelatorioComponent implements OnInit {
  loading = false;
  dados: LancamentoRecorrente[] = [];

  constructor(
    private service: LancamentoRecorrenteService,
    private pdfService: PdfService
  ) {}

  ngOnInit(): void {
    this.pesquisar();
  }

  pesquisar(): void {
    this.loading = true;
    this.service.listEntradas().subscribe({
      next: (data) => {
        this.dados = data;
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

    const titulo = `Relatório de Recorrentes - Entradas`;

    const colunas = [
      { campo: 'descricao', label: 'Descrição' },
      { campo: 'valor', label: 'Valor', formatar: (v: number) => this.formatarMoeda(v) },
      { campo: 'periodicidade', label: 'Periodicidade' },
      { campo: 'diaExecucao', label: 'Dia Execução' },
      { campo: 'dataInicio', label: 'Data Início', formatar: (v: string) => this.formatarData(v) },
      { campo: 'dataFim', label: 'Data Fim', formatar: (v: string | null) => v ? this.formatarData(v) : '-' },
      { campo: 'ativo', label: 'Status', formatar: (v: boolean) => v ? 'Ativo' : 'Inativo' }
    ];

    this.pdfService.gerarPdf(titulo, this.dados, colunas);
  }

  visualizarPdf(): void {
    if (this.dados.length === 0) {
      alert('Não há dados para visualizar o relatório');
      return;
    }

    const titulo = `Relatório de Recorrentes - Entradas`;

    const colunas = [
      { campo: 'descricao', label: 'Descrição' },
      { campo: 'valor', label: 'Valor', formatar: (v: number) => this.formatarMoeda(v) },
      { campo: 'periodicidade', label: 'Periodicidade' },
      { campo: 'diaExecucao', label: 'Dia Execução' },
      { campo: 'dataInicio', label: 'Data Início', formatar: (v: string) => this.formatarData(v) },
      { campo: 'dataFim', label: 'Data Fim', formatar: (v: string | null) => v ? this.formatarData(v) : '-' },
      { campo: 'ativo', label: 'Status', formatar: (v: boolean) => v ? 'Ativo' : 'Inativo' }
    ];

    this.pdfService.visualizarPdf(titulo, this.dados, colunas);
  }

  formatarData(data: string): string {
    if (!data) return '-';
    const d = new Date(data);
    return d.toLocaleDateString('pt-BR');
  }

  formatarMoeda(valor: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  }
}

