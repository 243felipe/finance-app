import { Injectable } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { BehaviorSubject, filter } from 'rxjs';

export interface Tab {
  id: string;
  label: string;
  route: string;
  icon?: string;
}

@Injectable({
  providedIn: 'root'
})
export class TabsService {
  private tabsSubject = new BehaviorSubject<Tab[]>([]);
  public tabs$ = this.tabsSubject.asObservable();

  private routeLabels: Record<string, string> = {
    '/dashboard': 'Dashboard',
    '/cadastros/categorias-financeiras': 'Categorias Financeiras',
    '/cadastros/contas-fixas': 'Contas Fixas',
    '/cadastros/fontes-renda': 'Fontes de Renda',
    '/cadastros/formas-pagamento': 'Formas de Pagamento',
    '/lancamentos/receita/salario': 'Receita - Salário',
    '/lancamentos/receita/renda-extra': 'Receita - Renda Extra',
    '/lancamentos/despesa/contas-dia': 'Despesa - Contas do Dia',
    '/lancamentos/despesa/despesas-extras': 'Despesa - Extras',
    '/lancamentos/pagamento-conta-fixa': 'Pagamento Conta Fixa',
    '/lancamentos/recorrentes/entradas': 'Recorrentes - Entradas',
    '/lancamentos/recorrentes/saidas': 'Recorrentes - Saídas',
    '/mercado/lancamento': 'Lançamento - Mercado',
    '/mercado/anotacoes': 'Anotações - Mercado'
  };

  private routeIcons: Record<string, string> = {
    '/dashboard': 'pi pi-home',
    '/cadastros/categorias-financeiras': 'pi pi-list',
    '/cadastros/contas-fixas': 'pi pi-briefcase',
    '/cadastros/fontes-renda': 'pi pi-wallet',
    '/cadastros/formas-pagamento': 'pi pi-credit-card',
    '/lancamentos/receita/salario': 'pi pi-dollar',
    '/lancamentos/receita/renda-extra': 'pi pi-dollar',
    '/lancamentos/despesa/contas-dia': 'pi pi-book',
    '/lancamentos/despesa/despesas-extras': 'pi pi-book',
    '/lancamentos/pagamento-conta-fixa': 'pi pi-credit-card',
    '/lancamentos/recorrentes/entradas': 'pi pi-refresh',
    '/lancamentos/recorrentes/saidas': 'pi pi-refresh',
    '/mercado/lancamento': 'pi pi-dollar',
    '/mercado/anotacoes': 'pi pi-list'
  };

  constructor(private router: Router) {
    // Adiciona o Dashboard como primeira aba sempre
    this.ensureDashboardTab();
    
    // Observa mudanças de rota e adiciona abas automaticamente
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event) => {
        const url = (event as NavigationEnd).urlAfterRedirects;
        if (url && url !== '/login') {
          this.addTab(url);
          // Garante que o Dashboard sempre esteja presente
          this.ensureDashboardTab();
        }
      });
  }

  private ensureDashboardTab(): void {
    const currentTabs = this.tabsSubject.value;
    const dashboardTab: Tab = {
      id: '/dashboard',
      label: 'Dashboard',
      route: '/dashboard',
      icon: 'pi pi-home'
    };

    // Verifica se o Dashboard já existe
    const dashboardExists = currentTabs.some((tab) => tab.id === '/dashboard');

    if (!dashboardExists) {
      // Adiciona o Dashboard como primeira aba
      this.tabsSubject.next([dashboardTab, ...currentTabs]);
    } else {
      // Garante que o Dashboard seja sempre a primeira aba
      const otherTabs = currentTabs.filter((tab) => tab.id !== '/dashboard');
      this.tabsSubject.next([dashboardTab, ...otherTabs]);
    }
  }

  getTabs(): Tab[] {
    return this.tabsSubject.value;
  }

  addTab(route: string): void {
    // Não adiciona o Dashboard novamente, ele já é gerenciado pelo ensureDashboardTab
    if (route === '/dashboard') {
      this.ensureDashboardTab();
      return;
    }

    const currentTabs = this.tabsSubject.value;
    const tabId = route;

    // Verifica se a aba já existe
    if (currentTabs.some((tab) => tab.id === tabId)) {
      return;
    }

    const label = this.routeLabels[route] || this.extractLabelFromRoute(route);
    const icon = this.routeIcons[route];

    const newTab: Tab = {
      id: tabId,
      label,
      route,
      icon
    };

    // Adiciona a nova aba, mas mantém o Dashboard como primeira
    const dashboardTab = currentTabs.find((tab) => tab.id === '/dashboard');
    const otherTabs = currentTabs.filter((tab) => tab.id !== '/dashboard');
    
    if (dashboardTab) {
      this.tabsSubject.next([dashboardTab, ...otherTabs, newTab]);
    } else {
      this.tabsSubject.next([...currentTabs, newTab]);
    }
  }

  removeTab(tabId: string): void {
    // Não permite remover o Dashboard
    if (tabId === '/dashboard') {
      return;
    }

    const currentTabs = this.tabsSubject.value;
    const filteredTabs = currentTabs.filter((tab) => tab.id !== tabId);
    this.tabsSubject.next(filteredTabs);

    // Se a aba removida era a ativa, navega para o Dashboard
    const currentRoute = this.router.url;
    if (currentRoute === tabId) {
      this.router.navigate(['/dashboard']);
    }
  }

  navigateToTab(tab: Tab): void {
    this.router.navigate([tab.route]);
  }

  private extractLabelFromRoute(route: string): string {
    // Extrai um label amigável da rota
    const parts = route.split('/').filter((p) => p);
    return parts
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }
}

