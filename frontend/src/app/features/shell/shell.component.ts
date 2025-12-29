import { CommonModule, NgIf } from '@angular/common';
import { AfterViewInit, Component, ElementRef, HostListener, Input, OnDestroy, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
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
  imports: [
    CommonModule,
    NgIf,
    FormsModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    ButtonModule,
    DialogModule,
    InputTextModule
  ],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss'
})
export class ShellComponent implements AfterViewInit, OnDestroy {
  @Input() title = 'Portal';
  collapsed = true; // inicia fechado
  expanded: Record<string, boolean> = {};
  tabs: Tab[] = [];
  private tabsSubscription?: Subscription;

  // User menu
  userMenuOpen = false;
  dropdownPosition = { top: 0, right: 0 };
  @ViewChild('userMenuContainer', { read: ElementRef }) userMenuContainer?: ElementRef<HTMLDivElement>;
  @ViewChild('userBtn', { read: ElementRef }) userBtn?: ElementRef<HTMLButtonElement>;

  // Profile modal
  profileModalVisible = false;
  profileName = '';
  profileLogin = '';
  profilePassword = '';
  editingName = false;
  editingLogin = false;
  editingPassword = false;
  savingName = false;
  savingLogin = false;
  savingPassword = false;

  // Logout confirm modal
  logoutConfirmModalVisible = false;

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
    // Garante que o Dashboard sempre esteja presente
    this.tabsService.addTab('/dashboard');
    // Adiciona a aba atual se já houver uma rota ativa
    const currentRoute = this.router.url;
    if (currentRoute && currentRoute !== '/login' && currentRoute !== '/dashboard') {
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

  // User menu methods
  toggleUserMenu(): void {
    this.userMenuOpen = !this.userMenuOpen;
    if (this.userMenuOpen && this.userBtn?.nativeElement) {
      const rect = this.userBtn.nativeElement.getBoundingClientRect();
      this.dropdownPosition = {
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right
      };
    }
  }

  closeUserMenu(): void {
    this.userMenuOpen = false;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.userMenuContainer?.nativeElement && !this.userMenuContainer.nativeElement.contains(event.target as Node)) {
      this.closeUserMenu();
    }
  }

  // Profile modal methods
  openProfileModal(): void {
    this.closeUserMenu();
    this.profileModalVisible = true;
    this.loadProfile();
  }

  closeProfileModal(): void {
    this.profileModalVisible = false;
    this.editingName = false;
    this.editingLogin = false;
    this.editingPassword = false;
    this.profileName = '';
    this.profileLogin = '';
    this.profilePassword = '';
  }

  loadProfile(): void {
    this.auth.getProfile().subscribe({
      next: (profile) => {
        this.profileName = profile.name || '';
        this.profileLogin = profile.login || '';
        this.profilePassword = '';
      },
      error: (err) => {
        console.error('Erro ao carregar perfil:', err);
      }
    });
  }

  toggleEditName(): void {
    if (this.editingName) {
      this.saveName();
    } else {
      this.editingName = true;
    }
  }

  saveName(): void {
    if (!this.profileName.trim()) {
      return;
    }
    this.savingName = true;
    this.auth.updateProfile({ name: this.profileName }).subscribe({
      next: () => {
        this.savingName = false;
        this.closeProfileModal();
        // Navega para o dashboard (ele recarrega automaticamente os dados)
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        console.error('Erro ao salvar nome:', err);
        this.savingName = false;
      }
    });
  }

  toggleEditLogin(): void {
    if (this.editingLogin) {
      this.saveLogin();
    } else {
      this.editingLogin = true;
    }
  }

  saveLogin(): void {
    if (!this.profileLogin.trim()) {
      return;
    }
    this.savingLogin = true;
    this.auth.updateProfile({ login: this.profileLogin }).subscribe({
      next: () => {
        this.savingLogin = false;
        this.closeProfileModal();
        // Navega para o dashboard (ele recarrega automaticamente os dados)
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        console.error('Erro ao salvar login:', err);
        this.savingLogin = false;
      }
    });
  }

  toggleEditPassword(): void {
    if (this.editingPassword) {
      this.savePassword();
    } else {
      this.editingPassword = true;
      this.profilePassword = '';
    }
  }

  savePassword(): void {
    if (!this.profilePassword.trim()) {
      return;
    }
    this.savingPassword = true;
    this.auth.updateProfile({ password: this.profilePassword }).subscribe({
      next: () => {
        this.savingPassword = false;
        this.closeProfileModal();
        // Navega para o dashboard (ele recarrega automaticamente os dados)
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        console.error('Erro ao salvar senha:', err);
        this.savingPassword = false;
      }
    });
  }

  // Logout confirm modal methods
  openLogoutConfirmModal(): void {
    this.closeUserMenu();
    this.logoutConfirmModalVisible = true;
  }

  closeLogoutConfirmModal(): void {
    this.logoutConfirmModalVisible = false;
  }

  confirmLogout(): void {
    this.closeLogoutConfirmModal();
    this.logout();
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
