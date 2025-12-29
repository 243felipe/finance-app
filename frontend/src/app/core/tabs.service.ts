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
    '/lancamentos/recorrentes/saidas': 'Recorrentes - Saídas'
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
    '/lancamentos/recorrentes/saidas': 'pi pi-refresh'
  };

  constructor(private router: Router) {
    // Observa mudanças de rota e adiciona abas automaticamente
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event) => {
        const url = (event as NavigationEnd).urlAfterRedirects;
        if (url && url !== '/login') {
          this.addTab(url);
        }
      });
  }

  getTabs(): Tab[] {
    return this.tabsSubject.value;
  }

  addTab(route: string): void {
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

    this.tabsSubject.next([...currentTabs, newTab]);
  }

  removeTab(tabId: string): void {
    const currentTabs = this.tabsSubject.value;
    const filteredTabs = currentTabs.filter((tab) => tab.id !== tabId);
    this.tabsSubject.next(filteredTabs);

    // Se a aba removida era a ativa, navega para a última aba ou dashboard
    const currentRoute = this.router.url;
    if (currentRoute === tabId) {
      if (filteredTabs.length > 0) {
        const lastTab = filteredTabs[filteredTabs.length - 1];
        this.router.navigate([lastTab.route]);
      } else {
        this.router.navigate(['/dashboard']);
      }
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

