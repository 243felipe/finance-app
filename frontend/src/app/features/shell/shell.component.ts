import { CommonModule, NgIf } from '@angular/common';
import { AfterViewInit, Component, ElementRef, Input, OnDestroy, ViewChild } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { Subscription } from 'rxjs';
import { AuthService } from '../../core/auth.service';
import { TabsService, Tab } from '../../core/tabs.service';

type MenuItem = {
  label: string;
  icon: string;
  route: string;
  children?: MenuItem[];
};

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, NgIf, RouterOutlet, RouterLink, RouterLinkActive, ButtonModule],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss'
})
export class ShellComponent implements AfterViewInit, OnDestroy {
  @Input() title = 'Portal';
  collapsed = true; // inicia fechado
  expanded: Record<string, boolean> = {};
  tabs: Tab[] = [];
  private tabsSubscription?: Subscription;

  @ViewChild('mainEl') mainEl?: ElementRef<HTMLDivElement>;
  @ViewChild('contentEl') contentEl?: ElementRef<HTMLElement>;

  menu: MenuItem[] = [
    { label: 'Dashboard', icon: 'pi pi-home', route: '/dashboard' },
    {
      label: 'Cadastros',
      icon: 'pi pi-briefcase',
      route: '',
      children: [
        { label: 'Categorias Financeiras', icon: 'pi pi-list', route: '/cadastros/categorias-financeiras' },
        { label: 'Contas Fixas', icon: 'pi pi-briefcase', route: '/cadastros/contas-fixas' },
        { label: 'Fontes de Renda', icon: 'pi pi-wallet', route: '/cadastros/fontes-renda' },
        { label: 'Formas de Pagamento', icon: 'pi pi-credit-card', route: '/cadastros/formas-pagamento' }
      ]
    },
    {
      label: 'Lançamentos',
      icon: 'pi pi-plus-circle',
      route: '',
      children: [
        { label: 'Receita - Salário', icon: 'pi pi-dollar', route: '/lancamentos/receita/salario' },
        { label: 'Receita - Renda Extra', icon: 'pi pi-dollar', route: '/lancamentos/receita/renda-extra' },
        { label: 'Despesa - Contas do Dia', icon: 'pi pi-book', route: '/lancamentos/despesa/contas-dia' },
        { label: 'Despesa - Extras', icon: 'pi pi-book', route: '/lancamentos/despesa/despesas-extras' },
        { label: 'Pagamento Conta Fixa', icon: 'pi pi-credit-card', route: '/lancamentos/pagamento-conta-fixa' },
        { label: 'Recorrentes - Entradas', icon: 'pi pi-refresh', route: '/lancamentos/recorrentes/entradas' },
        { label: 'Recorrentes - Saídas', icon: 'pi pi-refresh', route: '/lancamentos/recorrentes/saidas' }
      ]
    }
  ];

  constructor(
    private auth: AuthService,
    private router: Router,
    private tabsService: TabsService
  ) {
    this.tabsSubscription = this.tabsService.tabs$.subscribe((tabs) => {
      this.tabs = tabs;
    });
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.logSizes('init'), 0);
    // Adiciona a aba atual se já houver uma rota ativa
    const currentRoute = this.router.url;
    if (currentRoute && currentRoute !== '/login') {
      this.tabsService.addTab(currentRoute);
    }
  }

  toggle(): void {
    this.collapsed = !this.collapsed;
    if (this.collapsed) {
      this.expanded = {};
    }
    requestAnimationFrame(() => this.logSizes('toggle'));
  }

  toggleParent(item: MenuItem): void {
    if (this.collapsed || !item.children?.length) return;
    this.expanded[item.label] = !this.expanded[item.label];
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  navigateToTab(tab: Tab): void {
    this.tabsService.navigateToTab(tab);
  }

  closeTab(tab: Tab, event: Event): void {
    event.stopPropagation(); // Previne a navegação ao clicar no X
    this.tabsService.removeTab(tab.id);
  }

  isActiveTab(tab: Tab): boolean {
    return this.router.url === tab.route || this.router.url.startsWith(tab.route + '/');
  }

  ngOnDestroy(): void {
    this.tabsSubscription?.unsubscribe();
  }

  private logSizes(tag: string): void {
    const mainW = this.mainEl?.nativeElement.clientWidth ?? 0;
    const contentW = this.contentEl?.nativeElement.clientWidth ?? 0;
    // eslint-disable-next-line no-console
    console.log(`[shell] ${tag} | collapsed=${this.collapsed} | main=${mainW}px | content=${contentW}px`);
  }
}
