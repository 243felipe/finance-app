import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ChartModule } from 'primeng/chart';
import { ProgressBarModule } from 'primeng/progressbar';
import { ButtonModule } from 'primeng/button';
import { FixedAccountService } from '../../services/fixed-account.service';

type StatCard = {
  label: string;
  value: string;
  change?: string;
  icon: string;
};

type ProgressItem = {
  label: string;
  value: number;
};

type Notification = {
  title: string;
  time: string;
  type?: 'info' | 'warn' | 'error';
};

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, ChartModule, ProgressBarModule, ButtonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  cards: StatCard[] = [
    { label: 'Contas Fixas', value: 'R$ 0,00', change: '', icon: 'pi pi-wallet' },
    { label: 'Status OK', value: '98%', change: '+1,1%', icon: 'pi pi-check-circle' },
    { label: 'Métricas A/B', value: '312', change: '+3,1%', icon: 'pi pi-chart-bar' },
    { label: 'Alertas', value: '12', change: '-1,0%', icon: 'pi pi-exclamation-triangle' },
    { label: 'Clientes', value: '1.240', change: '+0,8%', icon: 'pi pi-users' }
  ];

  progress: ProgressItem[] = [
    { label: 'Processo Norte', value: 78 },
    { label: 'Processo Sul', value: 62 },
    { label: 'Processo Leste', value: 54 }
  ];

  notifications: Notification[] = [
    { title: 'Backup concluído com sucesso', time: 'há 5 min', type: 'info' },
    { title: 'Novo acesso administrador', time: 'há 12 min', type: 'warn' },
    { title: 'Fila de importação finalizada', time: 'há 25 min', type: 'info' }
  ];

  lineData: any;
  lineOptions: any;
  pieData: any;
  pieOptions: any;

  constructor(private fixedAccountService: FixedAccountService) {}

  ngOnInit(): void {
    this.carregarTotalContasFixas();
    this.setupCharts();
  }

  private carregarTotalContasFixas(): void {
    this.fixedAccountService.total().subscribe({
      next: (res) => {
        const total = res.total ?? 0;
        this.cards = [
          { label: 'Contas Fixas', value: this.formatCurrency(total), change: '', icon: 'pi pi-wallet' },
          ...this.cards.slice(1)
        ];
      },
      error: (err) => {
        console.error('Erro ao buscar total de contas fixas', err);
      }
    });
  }

  private formatCurrency(value: number): string {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  private setupCharts(): void {
    const textColor = '#0d0664';
    const gridColor = 'rgba(13,6,100,0.12)';

    this.lineData = {
      labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
      datasets: [
        {
          label: 'Métrica A',
          data: [42, 58, 64, 72, 69, 84],
          fill: true,
          borderColor: '#3418e8',
          tension: 0.35,
          backgroundColor: 'rgba(52,24,232,0.18)',
          pointRadius: 3
        },
        {
          label: 'Métrica B',
          data: [36, 44, 52, 61, 63, 70],
          fill: false,
          borderColor: '#0d0664',
          tension: 0.35,
          pointRadius: 3
        }
      ]
    };

    this.lineOptions = {
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          labels: { color: textColor }
        }
      },
      scales: {
        x: {
          ticks: { color: textColor },
          grid: { color: gridColor }
        },
        y: {
          ticks: { color: textColor },
          grid: { color: gridColor }
        }
      }
    };

    this.pieData = {
      labels: ['Norte', 'Sul', 'Leste', 'Oeste'],
      datasets: [
        {
          data: [34, 26, 22, 18],
          backgroundColor: ['#3418e8', '#5f4ae3', '#8974ff', '#b4a7ff'],
          hoverOffset: 8
        }
      ]
    };

    this.pieOptions = {
      plugins: {
        legend: { position: 'bottom', labels: { color: textColor } }
      }
    };
  }
}
