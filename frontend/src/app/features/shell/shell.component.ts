import { CommonModule, NgIf } from '@angular/common';
import { AfterViewInit, Component, ElementRef, Input, ViewChild } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { AuthService } from '../../core/auth.service';

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
export class ShellComponent implements AfterViewInit {
  @Input() title = 'Portal';
  collapsed = false;
  expanded: Record<string, boolean> = {};

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

  constructor(private auth: AuthService, private router: Router) {}

  ngAfterViewInit(): void {
    setTimeout(() => this.logSizes('init'), 0);
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

  private logSizes(tag: string): void {
    const mainW = this.mainEl?.nativeElement.clientWidth ?? 0;
    const contentW = this.contentEl?.nativeElement.clientWidth ?? 0;
    // eslint-disable-next-line no-console
    console.log(`[shell] ${tag} | collapsed=${this.collapsed} | main=${mainW}px | content=${contentW}px`);
  }
}
