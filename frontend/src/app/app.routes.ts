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
      import('./features/lancamentos/receita-renda-extra/receita-renda-extra.component').then(
        (c) => c.ReceitaRendaExtraComponent
      ),
    data: { title: 'Lançar Receita - Renda Extra' }
      },
      {
        path: 'lancamentos/despesa/contas-dia',
    loadComponent: () =>
      import('./features/lancamentos/despesa-contas-dia/despesa-contas-dia.component').then(
        (c) => c.DespesaContasDiaComponent
      ),
    data: { title: 'Lançar Despesa - Contas do Dia' }
      },
      {
        path: 'lancamentos/despesa/contas-a-pagar',
        loadComponent: () =>
          import('./features/lancamentos/contas-a-pagar/contas-a-pagar.component').then((c) => c.ContasAPagarComponent),
        data: { title: 'Despesa / Conta a Pagar' }
      },
      {
        path: 'lancamentos/despesa/despesas-extras',
    loadComponent: () =>
      import('./features/lancamentos/despesa-extra/despesa-extra.component').then((c) => c.DespesaExtraComponent),
    data: { title: 'Lançar Despesa - Despesas Extras' }
      },
      {
        path: 'lancamentos/pagamento-conta-fixa',
    loadComponent: () =>
      import('./features/lancamentos/pagamento-conta-fixa/pagamento-conta-fixa.component').then(
        (c) => c.PagamentoContaFixaComponent
      ),
    data: { title: 'Pagamento de Conta Fixa' }
      },
      {
        path: 'lancamentos/recorrentes/entradas',
        loadComponent: () =>
          import('./features/lancamentos/recorrentes-entradas/recorrentes-entradas.component').then(
            (c) => c.RecorrentesEntradasComponent
          ),
        data: { title: 'Lançamentos Recorrentes - Entradas' }
      },
      {
        path: 'lancamentos/recorrentes/saidas',
        loadComponent: () =>
          import('./features/shared/placeholder-page.component').then((c) => c.PlaceholderPageComponent),
        data: { title: 'Lançamentos Recorrentes - Saídas' }
      },
      {
        path: 'mercado/lancamento',
        loadComponent: () =>
          import('./features/mercado/lancamento-mercado/lancamento-mercado.component').then((c) => c.LancamentoMercadoComponent)
      },
      {
        path: 'mercado/anotacoes',
        loadComponent: () =>
          import('./features/mercado/anotacoes-mercado/anotacoes-mercado.component').then((c) => c.AnotacoesMercadoComponent)
      },
      {
        path: 'relatorios/receita-salario',
        loadComponent: () =>
          import('./features/relatorios/receita-salario-relatorio/receita-salario-relatorio.component').then(
            (c) => c.ReceitaSalarioRelatorioComponent
          )
      },
      {
        path: 'relatorios/receita-renda-extra',
        loadComponent: () =>
          import('./features/relatorios/receita-renda-extra-relatorio/receita-renda-extra-relatorio.component').then(
            (c) => c.ReceitaRendaExtraRelatorioComponent
          )
      },
      {
        path: 'relatorios/despesa-contas-dia',
        loadComponent: () =>
          import('./features/relatorios/despesa-contas-dia-relatorio/despesa-contas-dia-relatorio.component').then(
            (c) => c.DespesaContasDiaRelatorioComponent
          )
      },
      {
        path: 'relatorios/despesa-extras',
        loadComponent: () =>
          import('./features/relatorios/despesa-extras-relatorio/despesa-extras-relatorio.component').then(
            (c) => c.DespesaExtrasRelatorioComponent
          )
      },
      {
        path: 'relatorios/pagamento-conta-fixa',
        loadComponent: () =>
          import('./features/relatorios/pagamento-conta-fixa-relatorio/pagamento-conta-fixa-relatorio.component').then(
            (c) => c.PagamentoContaFixaRelatorioComponent
          )
      },
      {
        path: 'relatorios/recorrentes-entradas',
        loadComponent: () =>
          import('./features/relatorios/recorrentes-entradas-relatorio/recorrentes-entradas-relatorio.component').then(
            (c) => c.RecorrentesEntradasRelatorioComponent
          )
      },
      {
        path: 'relatorios/recorrentes-saidas',
        loadComponent: () =>
          import('./features/relatorios/recorrentes-saidas-relatorio/recorrentes-saidas-relatorio.component').then(
            (c) => c.RecorrentesSaidasRelatorioComponent
          )
      },
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' }
    ]
  },
  {
    path: '**',
    redirectTo: 'login'
  }
];
