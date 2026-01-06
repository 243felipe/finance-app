import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { ChartModule } from 'primeng/chart';
import { ProgressBarModule } from 'primeng/progressbar';
import { ButtonModule } from 'primeng/button';
import { Subscription, forkJoin } from 'rxjs';
import { FixedAccountService } from '../../services/fixed-account.service';
import { FixedAccount } from '../../models/fixed-account';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../core/auth.service';
import { DashboardService, DashboardCards, DashboardCharts, LancamentoSaida } from '../../services/dashboard.service';
import { LancamentoFinanceiroService } from '../../services/lancamento-financeiro.service';
import { LancamentoFinanceiro } from '../../models/lancamento-financeiro';

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

type CalendarDay = {
  day: number | null;
  isToday: boolean;
  isCurrentMonth: boolean;
  hasEntrada: boolean;
  hasSaida: boolean;
  hasContaFixa: boolean;
};

type CalendarEventMap = Record<
  string,
  { hasEntrada: boolean; hasSaida: boolean; hasContaFixa: boolean; items: LancamentoFinanceiro[] }
>;

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
    { label: 'Total em Estoque', value: 'R$ 0,00', change: '', icon: 'pi pi-arrow-up' },
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

  calendarMonthLabel = '';
  calendarYear = 0;
  calendarWeeks: CalendarDay[][] = [];
  private calendarEvents: CalendarEventMap = {};
  modalOpen = false;
  modalData: { dateLabel: string; entradas: LancamentoFinanceiro[]; saidas: LancamentoFinanceiro[] } | null = null;

  loading = false;

  private routerSubscription?: Subscription;

  constructor(
    private dashboardService: DashboardService,
    private authService: AuthService,
    private router: Router,
    private lancamentoService: LancamentoFinanceiroService,
    private fixedAccountService: FixedAccountService
  ) {}

  ngOnInit(): void {
    this.buildCalendar();
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

    this.carregarLancamentosCalendario();
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
        label: 'Total em Estoque', 
        value: this.formatCurrency(data.totalEstoque), 
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

  formatCurrency(value: number): string {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  private setupCharts(data: DashboardCharts): void {
    const colors = {
      text: '#0d0664',
      grid: 'rgba(13,6,100,0.12)',
      lineEntradas: '#0ea5e9',
      lineEntradasBg: 'rgba(14,165,233,0.18)',
      lineSaidas: '#f59e0b',
      lineSaidasBg: 'rgba(245,158,11,0.18)',
      barReceita: '#0ea5e9',
      barDespesa: '#f59e0b',
      pie: ['#0ea5e9', '#f59e0b'],
      pieHover: ['#0284c7', '#d97706'],
      doughnut: ['#0ea5e9', '#f59e0b'],
      doughnutHover: ['#0284c7', '#d97706']
    };
    const mapPalette = (labels: string[], palette: string[]) =>
      labels.map((_, idx) => palette[idx % palette.length]);

    // Gráfico de Linha - Evolução Mensal
    if (data.evolucaoMensal && data.evolucaoMensal.labels) {
      this.lineData = {
        labels: data.evolucaoMensal.labels,
        datasets: [
          {
            label: 'Entradas',
            data: data.evolucaoMensal.entradas || [],
            fill: true,
            borderColor: colors.lineEntradas,
            tension: 0.35,
            backgroundColor: colors.lineEntradasBg,
            pointRadius: 3
          },
          {
            label: 'Saídas',
            data: data.evolucaoMensal.saidas || [],
            fill: true,
            borderColor: colors.lineSaidas,
            backgroundColor: colors.lineSaidasBg,
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
          labels: { color: colors.text }
        }
      },
      scales: {
        x: {
          ticks: { color: colors.text },
          grid: { color: colors.grid }
        },
        y: {
          ticks: { color: colors.text },
          grid: { color: colors.grid }
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
    const pieColors = mapPalette(pieLabels, colors.pie);
    const pieHover = mapPalette(pieLabels, colors.pieHover);

    this.pieData = {
      labels: pieLabels,
      datasets: [
        {
          data: pieValues,
          backgroundColor: pieColors,
          hoverBackgroundColor: pieHover,
          hoverOffset: 8
        }
      ]
    };

    this.pieOptions = {
      plugins: {
        legend: { position: 'bottom', labels: { color: colors.text } }
      }
    };

    // Gráfico de Barras - Receita x Despesa
    if (data.receitaDespesa && data.receitaDespesa.labels) {
      this.barSmallData = {
        labels: data.receitaDespesa.labels,
        datasets: [
          { 
            label: 'Receita', 
            backgroundColor: colors.barReceita, 
            data: data.receitaDespesa.receita || []
          },
          { 
            label: 'Despesa', 
            backgroundColor: colors.barDespesa, 
            data: data.receitaDespesa.despesa || []
          }
        ]
      };
    }
    
    this.barSmallOptions = {
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom', labels: { color: colors.text } }
      },
      scales: {
        x: { ticks: { color: colors.text }, grid: { color: colors.grid } },
        y: { ticks: { color: colors.text }, grid: { color: colors.grid } }
      }
    };

    // Gráfico Doughnut - Mesma distribuição de categorias (paleta própria)
    const doughnutColors = mapPalette(pieLabels, colors.doughnut);
    const doughnutHover = mapPalette(pieLabels, colors.doughnutHover);
    this.doughnutData = {
      labels: pieLabels,
      datasets: [
        {
          data: pieValues,
          backgroundColor: doughnutColors,
          hoverBackgroundColor: doughnutHover,
          borderWidth: 1
        }
      ]
    };
    
    this.doughnutOptions = {
      cutout: '60%',
      plugins: {
        legend: { position: 'bottom', labels: { color: colors.text } }
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

  private carregarLancamentosCalendario(): void {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    forkJoin([
      this.lancamentoService.list(),
      this.fixedAccountService.list()
    ]).subscribe({
      next: ([lancamentos, contasFixas]: [LancamentoFinanceiro[], FixedAccount[]]) => {
        const marks: CalendarEventMap = {};

        // Lançamentos de entradas/saídas (somente mês/ano atuais)
        (lancamentos || []).forEach((l: LancamentoFinanceiro) => {
          if (!l.dataLancamento || !l.tipo) return;
          const dateObj = new Date(l.dataLancamento);
          const dayNum = dateObj.getDate();
          const monthNum = dateObj.getMonth();
          const yearNum = dateObj.getFullYear();
          const isContaFixaLanc = l.idContaFixa != null;

          if (!isContaFixaLanc) {
            if (monthNum !== currentMonth || yearNum !== currentYear) return;
          } else {
            if (dayNum < 1 || dayNum > 31) return;
          }

          const key = isContaFixaLanc
            ? this.toDateKey(currentYear, currentMonth, dayNum)
            : l.dataLancamento.substring(0, 10);

          const current = marks[key] || { hasEntrada: false, hasSaida: false, hasContaFixa: false, items: [] };
          if (l.tipo === 'E') current.hasEntrada = true;
          if (l.tipo === 'S') current.hasSaida = true;
          if (isContaFixaLanc) current.hasContaFixa = true;
          current.items.push(l);
          marks[key] = current;
        });

        // Contas fixas (sempre marcar pelo dia de vencimento no mês/ano atual)
        (contasFixas || []).forEach((cf: FixedAccount) => {
          if (!cf || !cf.diaVencimento) return;
          const dayNum = Number(cf.diaVencimento);
          if (dayNum < 1 || dayNum > 31) return;
          const key = this.toDateKey(currentYear, currentMonth, dayNum);
          const current = marks[key] || { hasEntrada: false, hasSaida: false, hasContaFixa: false, items: [] };
          current.hasContaFixa = true;

          const synthetic: LancamentoFinanceiro = {
            id: cf.id ?? 0,
            dataLancamento: key,
            descricao: cf.nome || cf.descricao || 'Conta fixa',
            tipo: 'S',
            valor: cf.valor ?? 0,
            idCategoria: cf.idCategoria ?? 0,
            idFonteRenda: null,
            idContaFixa: cf.id ?? null,
            idFormaPagamento: null,
            observacao: cf.descricao || '',
            categoria: undefined,
            fonteRenda: undefined,
            contaFixa: cf.nome || cf.descricao,
            formaPagamento: undefined,
            criadoEm: new Date().toISOString(),
            atualizadoEm: null
          };
          current.items.push(synthetic);
          marks[key] = current;
        });

        this.calendarEvents = marks;
        this.buildCalendar();
      },
      error: (err) => {
        console.error('Erro ao carregar lançamentos para o calendário', err);
      }
    });
  }

  private buildCalendar(): void {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();

    this.calendarYear = year;
    const monthName = today.toLocaleString('pt-BR', { month: 'long' });
    this.calendarMonthLabel = monthName.charAt(0).toUpperCase() + monthName.slice(1);

    const firstDay = new Date(year, month, 1);
    const startOffset = (firstDay.getDay() + 6) % 7; // Ajusta para semana começando na segunda
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const weeks: CalendarDay[][] = [];
    let cursor = 1 - startOffset;

    while (cursor <= daysInMonth) {
      const week: CalendarDay[] = [];

      for (let i = 0; i < 7; i++) {
        if (cursor < 1 || cursor > daysInMonth) {
          week.push({ day: null, isToday: false, isCurrentMonth: false, hasEntrada: false, hasSaida: false, hasContaFixa: false });
        } else {
          const isToday = cursor === today.getDate();
          const dateKey = this.toDateKey(year, month, cursor);
          const mark = this.calendarEvents[dateKey] || { hasEntrada: false, hasSaida: false, hasContaFixa: false, items: [] };
          week.push({
            day: cursor,
            isToday,
            isCurrentMonth: true,
            hasEntrada: mark.hasEntrada,
            hasSaida: mark.hasSaida,
            hasContaFixa: mark.hasContaFixa
          });
        }
        cursor++;
      }

      weeks.push(week);
    }

    this.calendarWeeks = weeks;
  }

  private toDateKey(year: number, monthZero: number, day: number): string {
    const m = String(monthZero + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    return `${year}-${m}-${d}`;
  }

  onDayClick(day: CalendarDay): void {
    if (!day.day || !day.isCurrentMonth) return;
    const month = new Date().getMonth();
    const key = this.toDateKey(this.calendarYear, month, day.day);
    const mark = this.calendarEvents[key];
    if (!mark || !mark.items.length) return;

    const entradas = mark.items.filter((i) => i.tipo === 'E');
    const saidas = mark.items.filter((i) => i.tipo === 'S');

    const dateObj = new Date(key);
    const dateLabel = dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

    this.modalData = { dateLabel, entradas, saidas };
    this.modalOpen = true;
  }

  fecharModal(): void {
    this.modalOpen = false;
    this.modalData = null;
  }
}
