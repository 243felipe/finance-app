import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { MessageService } from 'primeng/api';

import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    InputTextModule,
    PasswordModule,
    ButtonModule
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  form: FormGroup;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private messageService: MessageService
  ) {
    this.form = this.fb.group({
      login: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(4)]]
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.authService.login(this.form.value).subscribe({
      next: () => {
        this.loading = false;
        this.messageService.add({ severity: 'success', summary: 'Login realizado', detail: 'Bem-vindo!' });
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.loading = false;
        const detail = err?.error?.message || 'Não foi possível autenticar. Verifique suas credenciais.';
        this.messageService.add({ severity: 'error', summary: 'Erro de login', detail });
      }
    });
  }

  solicitarAjuda(): void {
    this.messageService.add({
      severity: 'info',
      summary: 'Precisa de suporte?',
      detail: 'Envie um e-mail para suporte@empresa.com ou fale com o time de TI.'
    });
  }
}











