import { Routes } from '@angular/router';

import { authGuard } from './core/auth.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  {
    path: 'login',
    loadComponent: () => import('./features/login/login.component').then((c) => c.LoginComponent)
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./features/shell/shell.component').then((c) => c.ShellComponent),
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component').then((c) => c.DashboardComponent)
      },
      {
        path: 'rendas/salarios',
        loadComponent: () => import('./features/rendas/salarios/salarios.component').then((c) => c.SalariosComponent)
      },
      {
        path: 'cadastros/categorias-financeiras',
        loadComponent: () =>
          import('./features/cadastros/categorias-financeiras/categorias-financeiras.component').then(
            (c) => c.CategoriasFinanceirasComponent
          )
      },
      {
        path: 'cadastros/contas-fixas',
        loadComponent: () =>
          import('./features/cadastros/contas-fixas/contas-fixas.component').then((c) => c.ContasFixasComponent)
      },
      {
        path: 'cadastros/fontes-renda',
        loadComponent: () =>
          import('./features/cadastros/fontes-renda/fontes-renda.component').then((c) => c.FontesRendaComponent)
      },
      {
        path: 'cadastros/formas-pagamento',
        loadComponent: () =>
          import('./features/cadastros/formas-pagamento/formas-pagamento.component').then((c) => c.FormasPagamentoComponent)
      },
      {
        path: 'lancamentos/receita/salario',
        loadComponent: () =>
          import('./features/lancamentos/receita-salario/receita-salario.component').then((c) => c.ReceitaSalarioComponent)
      },
      {
        path: 'lancamentos/receita/renda-extra',
        loadComponent: () =>
          import('./features/shared/placeholder-page.component').then((c) => c.PlaceholderPageComponent),
        data: { title: 'Lançar Receita - Renda Extra' }
      },
      {
        path: 'lancamentos/despesa/contas-dia',
        loadComponent: () =>
          import('./features/shared/placeholder-page.component').then((c) => c.PlaceholderPageComponent),
        data: { title: 'Lançar Despesa - Contas do Dia' }
      },
      {
        path: 'lancamentos/despesa/despesas-extras',
        loadComponent: () =>
          import('./features/shared/placeholder-page.component').then((c) => c.PlaceholderPageComponent),
        data: { title: 'Lançar Despesa - Despesas Extras' }
      },
      {
        path: 'lancamentos/pagamento-conta-fixa',
        loadComponent: () =>
          import('./features/shared/placeholder-page.component').then((c) => c.PlaceholderPageComponent),
        data: { title: 'Pagamento de Conta Fixa' }
      },
      {
        path: 'lancamentos/recorrentes/entradas',
        loadComponent: () =>
          import('./features/shared/placeholder-page.component').then((c) => c.PlaceholderPageComponent),
        data: { title: 'Lançamentos Recorrentes - Entradas' }
      },
      {
        path: 'lancamentos/recorrentes/saidas',
        loadComponent: () =>
          import('./features/shared/placeholder-page.component').then((c) => c.PlaceholderPageComponent),
        data: { title: 'Lançamentos Recorrentes - Saídas' }
      },
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' }
    ]
  },
  {
    path: '**',
    redirectTo: 'login'
  }
];
