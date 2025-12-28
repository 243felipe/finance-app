import { ApplicationConfig, LOCALE_ID, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { registerLocaleData } from '@angular/common';
import { providePrimeNG } from 'primeng/config';
import Lara from '@primeuix/themes/lara';
import ptBr from '@angular/common/locales/pt';

import { routes } from './app.routes';
import { authInterceptor } from './core/auth.interceptor';

registerLocaleData(ptBr);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideAnimations(),
    provideHttpClient(withInterceptors([authInterceptor])),
    { provide: LOCALE_ID, useValue: 'pt-BR' },
    providePrimeNG({
      theme: {
        preset: Lara
      }
    })
  ]
};
