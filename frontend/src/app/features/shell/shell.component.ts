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
import { SessionTimeoutService } from '../../core/session-timeout.service';
import { ListaComprasService } from '../../services/lista-compras.service';
import { ItemListaComprasService } from '../../services/item-lista-compras.service';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';

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
    InputTextModule,
    ToastModule
  ],
  templateUrl: './shell.component.html',
  styleUrls: ['./shell.component.scss']
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
  // Session timeout modal
  sessionTimeoutWarningVisible = false;
  private sessionTimeoutSubscription?: Subscription;
  isMobile = window.innerWidth <= 900;
  // Lista modal
  listaModalVisible = false;
  listaDescricao = '';
  listaItems: Array<{ descricao: string; valor: number | null }> = [];
  listaTotal = 0;
  savingLista = false;
  lastAddedItemIndex: number | null = null;

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
      label: 'Estoque',
      icon: 'pi pi-box',
      route: '',
      children: [
        { label: 'Cadastro - Categoria', icon: 'pi pi-tags', route: '/estoque/categoria' },
        { label: 'Cadastro de Produtos', icon: 'pi pi-box', route: '/estoque/produto' },
        { label: 'Entrada de Estoque', icon: 'pi pi-sign-in', route: '/estoque/entrada' }
      ]
    },
    {
      label: 'Lançamentos',
      icon: 'pi pi-plus-circle',
      route: '',
      children: [
        { label: 'Despesa - Contas do Dia', icon: 'pi pi-book', route: '/lancamentos/despesa/contas-dia' },
        { label: 'Pagamento Conta Fixa', icon: 'pi pi-credit-card', route: '/lancamentos/pagamento-conta-fixa' },
        { label: 'Lançamentos Serviços', icon: 'pi pi-briefcase', route: '/lancamentos/servicos' },
        // Itens removidos conforme solicitação:
        // - Receita - Salário
        // - Receita - Renda Extra
        // - Despesa (Unificada)
        // - Despesa - Extras
        // - Recorrentes - Entradas
        // - Recorrentes - Saídas
      ]
    },
    {
      label: 'Relatórios',
      icon: 'pi pi-file-pdf',
      route: '',
      children: [
        { label: 'Receita - Salário', icon: 'pi pi-dollar', route: '/relatorios/receita-salario' },
        { label: 'Receita - Renda Extra', icon: 'pi pi-dollar', route: '/relatorios/receita-renda-extra' },
        { label: 'Despesa - Contas do Dia', icon: 'pi pi-book', route: '/relatorios/despesa-contas-dia' },
        { label: 'Despesa - Extras', icon: 'pi pi-book', route: '/relatorios/despesa-extras' },
        { label: 'Pagamento Conta Fixa', icon: 'pi pi-credit-card', route: '/relatorios/pagamento-conta-fixa' },
        { label: 'Recorrentes - Entradas', icon: 'pi pi-refresh', route: '/relatorios/recorrentes-entradas' },
        { label: 'Recorrentes - Saídas', icon: 'pi pi-refresh', route: '/relatorios/recorrentes-saidas' }
      ]
    }
  ];

  constructor(
    private auth: AuthService,
    private router: Router,
    private tabsService: TabsService,
    private sessionTimeoutService: SessionTimeoutService,
    private listaComprasService: ListaComprasService,
    private itemListaComprasService: ItemListaComprasService,
    private messageService: MessageService
  ) {
    this.tabsSubscription = this.tabsService.tabs$.subscribe((tabs) => {
      this.tabs = tabs;
    });

    // Observa o aviso de timeout de sessão
    this.sessionTimeoutSubscription = this.sessionTimeoutService.showWarning$.subscribe((showWarning) => {
      this.sessionTimeoutWarningVisible = showWarning;
    });
  }

  ngAfterViewInit(): void {
    this.updateIsMobile();
    setTimeout(() => this.logSizes('init'), 0);
    // Garante que o Dashboard sempre esteja presente
    this.tabsService.addTab('/dashboard');
    // Adiciona a aba atual se já houver uma rota ativa
    const currentRoute = this.router.url;
    if (currentRoute && currentRoute !== '/login' && currentRoute !== '/dashboard') {
      this.tabsService.addTab(currentRoute);
    }
    // Inicializa o monitoramento de timeout de sessão
    this.sessionTimeoutService.initialize();
  }

  toggle(): void {
    this.collapsed = !this.collapsed;
    if (this.collapsed) {
      this.expanded = {};
    }
    requestAnimationFrame(() => this.logSizes('toggle'));
  }

  onMenuClick(): void {
    // Fecha o drawer em mobile após clicar em um item do menu
    if (this.isMobile && !this.collapsed) {
      this.collapsed = true;
    }
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
    // Fecha o drawer em mobile após navegação
    if (this.isMobile && !this.collapsed) {
      this.collapsed = true;
    }
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
    this.sessionTimeoutSubscription?.unsubscribe();
  }

  // Session timeout methods
  extendSession(): void {
    this.sessionTimeoutService.extendSession();
    this.sessionTimeoutWarningVisible = false;
  }

  handleSessionTimeout(): void {
    this.sessionTimeoutService.logout();
    this.sessionTimeoutWarningVisible = false;
  }

  private logSizes(tag: string): void {
    const mainW = this.mainEl?.nativeElement.clientWidth ?? 0;
    const contentW = this.contentEl?.nativeElement.clientWidth ?? 0;
    // eslint-disable-next-line no-console
    console.log(`[shell] ${tag} | collapsed=${this.collapsed} | main=${mainW}px | content=${contentW}px`);
  }

  @HostListener('window:resize')
  onResize(): void {
    this.updateIsMobile();
  }

  private updateIsMobile(): void {
    this.isMobile = window.innerWidth <= 900;
  }

  // Lista modal methods
  openListaModal(): void {
    this.listaModalVisible = true;
    this.listaDescricao = '';
    this.listaItems = [];
    this.listaTotal = 0;
  }

  closeListaModal(): void {
    this.listaModalVisible = false;
    this.listaDescricao = '';
    this.listaItems = [];
    this.listaTotal = 0;
  }

  addItem(): void {
    this.listaItems.push({ descricao: '', valor: null });
    this.lastAddedItemIndex = this.listaItems.length - 1;
    // Foca no input após o DOM ser atualizado
    setTimeout(() => {
      const inputId = `item-desc-${this.lastAddedItemIndex}`;
      const inputElement = document.getElementById(inputId);
      if (inputElement) {
        // Scroll até o elemento para garantir que esteja visível
        inputElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        // Foca no input
        inputElement.focus();
      }
    }, 50);
  }

  removeItem(index: number): void {
    this.listaItems.splice(index, 1);
    this.updateTotal();
  }

  updateTotal(): void {
    this.listaTotal = this.listaItems.reduce((sum, item) => {
      const valor = item.valor || 0;
      return sum + valor;
    }, 0);
  }

  saveLista(): void {
    if (!this.listaDescricao.trim() || this.listaItems.length === 0) {
      return;
    }

    // Valida se todos os itens têm descrição e valor
    const invalidItems = this.listaItems.filter(
      item => !item.descricao.trim() || item.valor === null || item.valor <= 0
    );

    if (invalidItems.length > 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Atenção',
        detail: 'Preencha todos os campos dos itens (nome e valor maior que zero)'
      });
      return;
    }

    this.savingLista = true;

    // Prepara o payload
    const payload = {
      nome: this.listaDescricao.trim(),
      itens: this.listaItems.map(item => ({
        descricao: item.descricao.trim(),
        valor: item.valor!
      }))
    };

    // Cria a lista com os itens em uma única transação
    this.listaComprasService.createComItens(payload).subscribe({
      next: () => {
        this.savingLista = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Sucesso',
          detail: 'Lista de compras criada com sucesso!'
        });
        this.closeListaModal();
      },
      error: (err) => {
        console.error('Erro ao criar lista:', err);
        this.savingLista = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: err.error?.message || 'Erro ao criar a lista de compras'
        });
      }
    });
  }
}

