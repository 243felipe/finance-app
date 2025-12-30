import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { ChartModule } from 'primeng/chart';
import { ProgressBarModule } from 'primeng/progressbar';
import { ButtonModule } from 'primeng/button';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../core/auth.service';
import { DashboardService, DashboardCards, DashboardCharts, LancamentoSaida } from '../../services/dashboard.service';

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
  valor?: string;
  type?: 'info' | 'warn' | 'error';
};

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, ChartModule, ProgressBarModule, ButtonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit, OnDestroy {
  saudacao = '';
  cards: StatCard[] = [
    { label: 'Total Entradas (mês)', value: 'R$ 0,00', change: '', icon: 'pi pi-arrow-up' },
    { label: 'Total Saídas (mês)', value: 'R$ 0,00', change: '', icon: 'pi pi-arrow-down' },
    { label: 'Recorrentes - Entradas', value: 'R$ 0,00', change: '', icon: 'pi pi-refresh' },
    { label: 'Contas Fixas', value: 'R$ 0,00', change: '', icon: 'pi pi-wallet' },
    { label: 'Pagto Conta Fixa (mês)', value: 'R$ 0,00', change: '', icon: 'pi pi-calendar' }
  ];

  progress: ProgressItem[] = [];

  notifications: Notification[] = [];

  lineData: any = null;
  lineOptions: any = null;
  pieData: any = null;
  pieOptions: any = null;
  barSmallData: any = null;
  barSmallOptions: any = null;
  doughnutData: any = null;
  doughnutOptions: any = null;

  loading = false;

  private routerSubscription?: Subscription;

  constructor(
    private dashboardService: DashboardService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.carregarDados();
    
    // Observa mudanças de rota para recarregar dados sempre que o dashboard for acessado
    this.routerSubscription = this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event) => {
        const navigationEnd = event as NavigationEnd;
        if (navigationEnd.urlAfterRedirects === '/dashboard') {
          this.carregarDados();
        }
      });
  }

  ngOnDestroy(): void {
    this.routerSubscription?.unsubscribe();
  }

  private carregarDados(): void {
    this.atualizarSaudacao();
    this.loading = true;
    
    // Carrega cards e gráficos em paralelo
    this.dashboardService.getCards().subscribe({
      next: (cardsData) => {
        this.atualizarCards(cardsData);
        this.loading = false;
      },
      error: (err) => {
        console.error('Erro ao carregar cards do dashboard', err);
        this.loading = false;
      }
    });

    this.dashboardService.getCharts().subscribe({
      next: (chartsData) => {
        this.setupCharts(chartsData);
      },
      error: (err) => {
        console.error('Erro ao carregar gráficos do dashboard', err);
      }
    });

    this.dashboardService.getLancamentosSaidasMes().subscribe({
      next: (lancamentos) => {
        this.carregarNotificacoes(lancamentos);
      },
      error: (err) => {
        console.error('Erro ao carregar lançamentos de saída', err);
      }
    });
  }

  private carregarNotificacoes(lancamentos: LancamentoSaida[]): void {
    this.notifications = lancamentos.map((l) => {
      const data = new Date(l.dataLancamento);
      const hoje = new Date();
      const diffMs = hoje.getTime() - data.getTime();
      const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const diffHoras = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMinutos = Math.floor(diffMs / (1000 * 60));

      let tempoTexto = '';
      if (diffDias > 0) {
        tempoTexto = diffDias === 1 ? 'há 1 dia' : `há ${diffDias} dias`;
      } else if (diffHoras > 0) {
        tempoTexto = diffHoras === 1 ? 'há 1 hora' : `há ${diffHoras} horas`;
      } else if (diffMinutos > 0) {
        tempoTexto = diffMinutos === 1 ? 'há 1 min' : `há ${diffMinutos} min`;
      } else {
        tempoTexto = 'agora';
      }

      return {
        title: l.descricao,
        time: tempoTexto,
        valor: this.formatCurrency(l.valor),
        type: 'info' as const
      };
    });
  }

  private atualizarCards(data: DashboardCards): void {
    this.cards = [
      { 
        label: 'Total Entradas (mês)', 
        value: this.formatCurrency(data.totalEntradasMes), 
        change: '', 
        icon: 'pi pi-arrow-up' 
      },
      { 
        label: 'Total Saídas (mês)', 
        value: this.formatCurrency(data.totalSaidasMes), 
        change: '', 
        icon: 'pi pi-arrow-down' 
      },
      { 
        label: 'Recorrentes - Entradas', 
        value: this.formatCurrency(data.totalRecorrentesEntradas), 
        change: '', 
        icon: 'pi pi-refresh' 
      },
      { 
        label: 'Contas Fixas', 
        value: this.formatCurrency(data.totalContasFixas), 
        change: '', 
        icon: 'pi pi-wallet' 
      },
      { 
        label: 'Pagto Conta Fixa (mês)', 
        value: this.formatCurrency(data.totalPagamentosContaFixaMes), 
        change: '', 
        icon: 'pi pi-calendar' 
      }
    ];
  }

  private formatCurrency(value: number): string {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  private setupCharts(data: DashboardCharts): void {
    const textColor = '#0d0664';
    const gridColor = 'rgba(13,6,100,0.12)';

    // Gráfico de Linha - Evolução Mensal
    if (data.evolucaoMensal && data.evolucaoMensal.labels) {
      this.lineData = {
        labels: data.evolucaoMensal.labels,
        datasets: [
          {
            label: 'Entradas',
            data: data.evolucaoMensal.entradas || [],
            fill: true,
            borderColor: '#3418e8',
            tension: 0.35,
            backgroundColor: 'rgba(52,24,232,0.18)',
            pointRadius: 3
          },
          {
            label: 'Saídas',
            data: data.evolucaoMensal.saidas || [],
            fill: false,
            borderColor: '#0d0664',
            tension: 0.35,
            pointRadius: 3
          }
        ]
      };
    }

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

    // Gráfico de Pizza - Distribuição por Categoria
    const pieLabels = data.distribuicaoCategorias.labels.length > 0 
      ? data.distribuicaoCategorias.labels 
      : ['Sem dados'];
    const pieValues = data.distribuicaoCategorias.values.length > 0 
      ? data.distribuicaoCategorias.values 
      : [1];

    this.pieData = {
      labels: pieLabels,
      datasets: [
        {
          data: pieValues,
          backgroundColor: ['#3418e8', '#5f4ae3', '#8974ff', '#b4a7ff', '#d4c9ff', '#e8dfff'],
          hoverOffset: 8
        }
      ]
    };

    this.pieOptions = {
      plugins: {
        legend: { position: 'bottom', labels: { color: textColor } }
      }
    };

    // Gráfico de Barras - Receita x Despesa
    if (data.receitaDespesa && data.receitaDespesa.labels) {
      this.barSmallData = {
        labels: data.receitaDespesa.labels,
        datasets: [
          { 
            label: 'Receita', 
            backgroundColor: '#3418e8', 
            data: data.receitaDespesa.receita || []
          },
          { 
            label: 'Despesa', 
            backgroundColor: '#8b5cf6', 
            data: data.receitaDespesa.despesa || []
          }
        ]
      };
    }
    
    this.barSmallOptions = {
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom', labels: { color: textColor } }
      },
      scales: {
        x: { ticks: { color: textColor }, grid: { color: gridColor } },
        y: { ticks: { color: textColor }, grid: { color: gridColor } }
      }
    };

    // Gráfico Doughnut - Mesma distribuição de categorias
    this.doughnutData = {
      labels: pieLabels,
      datasets: [
        {
          data: pieValues,
          backgroundColor: ['#3418e8', '#5f4ae3', '#8974ff', '#b4a7ff', '#d4c9ff', '#e8dfff'],
          borderWidth: 1
        }
      ]
    };
    
    this.doughnutOptions = {
      cutout: '60%',
      plugins: {
        legend: { position: 'bottom', labels: { color: textColor } }
      }
    };
  }

  private atualizarSaudacao(): void {
    const hora = new Date().getHours();
    const name = this.authService.getName();
    const nome = name ? name : 'Usuário';
    if (hora < 12) {
      this.saudacao = `Bom dia, ${nome}!`;
    } else if (hora < 18) {
      this.saudacao = `Boa tarde, ${nome}!`;
    } else {
      this.saudacao = `Boa noite, ${nome}!`;
    }
  }
}
