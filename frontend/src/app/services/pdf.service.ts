import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PdfService {
  gerarPdf(titulo: string, dados: any[], colunas: { campo: string; label: string; formatar?: (valor: any) => string }[]): void {
    const html = this.gerarHtmlRelatorio(titulo, dados, colunas);
    const janela = window.open('', '_blank');
    if (!janela) {
      alert('Por favor, permita pop-ups para gerar o PDF');
      return;
    }
    janela.document.write(html);
    janela.document.close();
    janela.print();
  }

  visualizarPdf(titulo: string, dados: any[], colunas: { campo: string; label: string; formatar?: (valor: any) => string }[]): void {
    const html = this.gerarHtmlRelatorio(titulo, dados, colunas);
    const janela = window.open('', '_blank');
    if (!janela) {
      alert('Por favor, permita pop-ups para visualizar o PDF');
      return;
    }
    janela.document.write(html);
    janela.document.close();
  }

  private gerarHtmlRelatorio(titulo: string, dados: any[], colunas: { campo: string; label: string; formatar?: (valor: any) => string }[]): string {
    const dataAtual = new Date().toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    let html = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${titulo}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            padding: 20px;
            color: #333;
            background: #fff;
          }
          .header {
            border-bottom: 3px solid #2563eb;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .header h1 {
            color: #2563eb;
            font-size: 24px;
            margin-bottom: 5px;
          }
          .header .info {
            color: #666;
            font-size: 12px;
            margin-top: 10px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
            font-size: 11px;
          }
          thead {
            background-color: #2563eb;
            color: #fff;
          }
          th {
            padding: 12px 8px;
            text-align: left;
            font-weight: 600;
            border: 1px solid #1e40af;
          }
          td {
            padding: 10px 8px;
            border: 1px solid #e5e7eb;
          }
          tbody tr:nth-child(even) {
            background-color: #f9fafb;
          }
          tbody tr:hover {
            background-color: #f3f4f6;
          }
          .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 2px solid #e5e7eb;
            text-align: center;
            color: #666;
            font-size: 11px;
          }
          .total {
            margin-top: 20px;
            padding: 15px;
            background-color: #f0f9ff;
            border-left: 4px solid #2563eb;
            font-weight: 600;
            font-size: 14px;
          }
          .text-right {
            text-align: right;
          }
          @media print {
            body {
              padding: 10px;
            }
            .header {
              page-break-after: avoid;
            }
            table {
              page-break-inside: auto;
            }
            tr {
              page-break-inside: avoid;
              page-break-after: auto;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${titulo}</h1>
          <div class="info">Gerado em: ${dataAtual}</div>
        </div>
    `;

    if (dados.length === 0) {
      html += '<p>Nenhum registro encontrado no período selecionado.</p>';
    } else {
      html += '<table>';
      html += '<thead><tr>';
      colunas.forEach(col => {
        html += `<th>${col.label}</th>`;
      });
      html += '</tr></thead>';
      html += '<tbody>';

      let total = 0;
      const self = this;
      dados.forEach(item => {
        html += '<tr>';
        colunas.forEach(col => {
          let valor = item[col.campo];
          if (col.formatar) {
            valor = col.formatar(valor);
          } else if (typeof valor === 'number' && col.campo.includes('valor')) {
            valor = self.formatarMoeda(valor);
            total += item[col.campo];
          } else if (typeof valor === 'string' && valor.includes('T')) {
            valor = self.formatarData(valor);
          }
          html += `<td>${valor || '-'}</td>`;
        });
        html += '</tr>';
      });

      html += '</tbody></table>';

      if (total > 0) {
        html += `<div class="total">Total: ${self.formatarMoeda(total)}</div>`;
      }
    }

    html += `
        <div class="footer">
          <p>Incret Finanças - Sistema de Gestão Financeira</p>
        </div>
      </body>
      </html>
    `;

    return html;
  }

  private formatarMoeda(valor: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  }

  private formatarData(data: string): string {
    if (!data) return '-';
    const d = new Date(data);
    return d.toLocaleDateString('pt-BR');
  }
}

