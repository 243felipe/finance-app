import { Injectable, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class SessionTimeoutService implements OnDestroy {
  private readonly TIMEOUT_DURATION = 45 * 60 * 1000; // 45 minutos em milissegundos
  private readonly AUTO_LOGOUT_DELAY = 30 * 1000; // 30 segundos após o aviso
  private timeoutTimer?: ReturnType<typeof setTimeout>;
  private autoLogoutTimer?: ReturnType<typeof setTimeout>;
  private lastActivityTime = Date.now();
  private routerSubscription?: Subscription;
  private activityHandlers: Array<{ event: string; handler: () => void }> = [];
  
  private showWarningSubject = new BehaviorSubject<boolean>(false);
  public showWarning$: Observable<boolean> = this.showWarningSubject.asObservable();

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    // Observa mudanças de rota para iniciar/parar o monitoramento
    this.routerSubscription = this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event) => {
        const navigationEnd = event as NavigationEnd;
        if (navigationEnd.urlAfterRedirects === '/login') {
          this.stopMonitoring();
        } else if (navigationEnd.urlAfterRedirects !== '/login' && this.authService.isAuthenticated()) {
          // Inicia o monitoramento quando navega para qualquer rota autenticada
          this.startMonitoring();
        }
      });

    // Inicia o monitoramento se já estiver autenticado (ao carregar a página)
    setTimeout(() => {
      if (this.authService.isAuthenticated() && this.router.url !== '/login') {
        this.startMonitoring();
      }
    }, 100);
  }

  private startMonitoring(): void {
    // Para o monitoramento anterior se existir
    this.stopMonitoring();

    // Só monitora se o usuário estiver autenticado
    if (!this.authService.isAuthenticated()) {
      return;
    }

    // Cria handlers para eventos de atividade
    const resetHandler = () => this.resetTimer();
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click', 'keydown'];
    
    this.activityHandlers = events.map((event) => {
      const handler = resetHandler;
      document.addEventListener(event, handler, true);
      return { event, handler };
    });

    this.resetTimer();
  }

  private resetTimer(): void {
    // Só reseta se estiver autenticado
    if (!this.authService.isAuthenticated()) {
      this.clearTimers();
      return;
    }

    this.lastActivityTime = Date.now();
    this.showWarningSubject.next(false);

    // Limpa os timers anteriores
    if (this.timeoutTimer) {
      clearTimeout(this.timeoutTimer);
    }
    if (this.autoLogoutTimer) {
      clearTimeout(this.autoLogoutTimer);
    }

    // Cria um novo timer
    this.timeoutTimer = setTimeout(() => {
      this.handleTimeout();
    }, this.TIMEOUT_DURATION);
  }

  private handleTimeout(): void {
    // Verifica se ainda está autenticado
    if (!this.authService.isAuthenticated()) {
      return;
    }

    // Mostra o aviso
    this.showWarningSubject.next(true);

    // Configura logout automático após o delay
    this.autoLogoutTimer = setTimeout(() => {
      this.logout();
    }, this.AUTO_LOGOUT_DELAY);
  }

  public logout(): void {
    this.clearTimers();
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  public extendSession(): void {
    // Usuário está ativo, reseta o timer
    this.resetTimer();
  }

  public initialize(): void {
    // Método público para inicializar o monitoramento
    if (this.authService.isAuthenticated() && this.router.url !== '/login') {
      this.startMonitoring();
    }
  }

  private clearTimers(): void {
    if (this.timeoutTimer) {
      clearTimeout(this.timeoutTimer);
      this.timeoutTimer = undefined;
    }
    if (this.autoLogoutTimer) {
      clearTimeout(this.autoLogoutTimer);
      this.autoLogoutTimer = undefined;
    }
    this.showWarningSubject.next(false);
  }

  private stopMonitoring(): void {
    this.clearTimers();
    
    // Remove todos os event listeners
    this.activityHandlers.forEach(({ event, handler }) => {
      document.removeEventListener(event, handler, true);
    });
    this.activityHandlers = [];
  }

  ngOnDestroy(): void {
    this.routerSubscription?.unsubscribe();
    this.stopMonitoring();
  }
}

