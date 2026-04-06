import { AfterViewInit, Component, HostListener, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { LoginService } from '../../../service/login.service';
import { PoDialogService } from '@po-ui/ng-components';
import { PoPageLogin } from '@po-ui/ng-templates';
import { PasswordChangeRequiredError } from '../../../interfaces/login.interface';

@Component({
  selector: 'app-pagina-login',
  templateUrl: './pagina-login.component.html',
  styleUrls: ['./pagina-login.component.css'],
  styles: ['.po-page-login-header-product-name {text-align: center !important}'],
})
export class PaginaLoginComponent implements OnInit, AfterViewInit {
  public loading = false;
  public passwordChangeLoading = false;
  public passwordChangeOpen = false;
  grpuser: any = [];
  erroLogin = '';
  passwordChangeError = '';
  anonButtonStyle: Record<string, string> = {};
  pendingLogin: { username: string; password: string; anomimo: boolean } | null = null;
  passwordChangeForm = {
    user: '',
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  };
  readonly loginLiterals = {
    title: 'Simplify Soluções',
    loginLabel: 'Usuário',
    passwordLabel: 'Senha',
  };
  readonly loginLanguages = [{ language: 'pt', description: 'Português' }];

  constructor(
    private loginService: LoginService,
    private router: Router,
    private poDialog: PoDialogService,
  ) {}

  ngOnInit() {
    this.loginService.logout();
  }

  ngAfterViewInit(): void {
    this.syncAnonButtonToSubmit();
    setTimeout(() => this.syncAnonButtonToSubmit(), 200);
    setTimeout(() => this.syncAnonButtonToSubmit(), 800);
  }

  @HostListener('window:resize')
  onResize(): void {
    this.syncAnonButtonToSubmit();
  }

  async loginSubmit(formData: PoPageLogin) {
    this.erroLogin = '';
    this.loading = true;
    const username = formData.login;
    const password = formData.password;
    const anomimo = false;
    this.pendingLogin = { username, password, anomimo };
    this.loginService.login(username, password, anomimo).subscribe({
      next: (token) => {
        this.loading = false;
        this.router.navigate(['/home']);
      },
      error: (erro) => {
        this.loading = false;
        if (this.isPasswordChangeRequiredError(erro)) {
          this.openPasswordChangeModal(erro);
          return;
        }
        const mensagem = this.getLoginErrorMessage(erro);
        this.erroLogin = mensagem;
        this.poDialog.alert({ title: 'Erro de Login', message: mensagem });
      },
    });
  }

  closePasswordChangeModal(): void {
    this.passwordChangeError = '';
    this.passwordChangeLoading = false;
    this.passwordChangeOpen = false;
  }

  submitPasswordChange(): void {
    this.passwordChangeError = '';

    const user = this.passwordChangeForm.user.trim();
    const oldPassword = this.passwordChangeForm.oldPassword;
    const newPassword = this.passwordChangeForm.newPassword;
    const confirmPassword = this.passwordChangeForm.confirmPassword;

    if (!user || !oldPassword || !newPassword || !confirmPassword) {
      this.passwordChangeError = 'Preencha todos os campos para continuar.';
      return;
    }

    if (newPassword !== confirmPassword) {
      this.passwordChangeError = 'A confirmação da nova senha não confere.';
      return;
    }

    this.passwordChangeLoading = true;
    this.loginService.changeExpiredPassword({ user, oldPassword, newPassword }).subscribe({
      next: () => {
        this.passwordChangeLoading = false;
        const pendingLogin = this.pendingLogin;
        this.closePasswordChangeModal();

        if (!pendingLogin) {
          this.poDialog.alert({
            title: 'Senha alterada',
            message: 'A senha foi alterada com sucesso. Faça login novamente.',
          });
          return;
        }

        this.loading = true;
        this.loginService.login(pendingLogin.username, newPassword, pendingLogin.anomimo).subscribe({
          next: () => {
            this.loading = false;
            this.router.navigate(['/home']);
          },
          error: (erro) => {
            this.loading = false;
            const mensagem = this.getLoginErrorMessage(erro);
            this.erroLogin = mensagem;
            this.poDialog.alert({ title: 'Erro de Login', message: mensagem });
          },
        });
      },
      error: (erro) => {
        this.passwordChangeLoading = false;
        this.passwordChangeError = this.getPasswordChangeErrorMessage(erro);
        this.poDialog.alert({
          title: 'Falha ao alterar senha',
          message: this.passwordChangeError,
        });
      },
    });
  }

  private getLoginErrorMessage(error: any): string {
    const mensagem =
      error?.error?.message ||
      error?.error?.detailedMessage ||
      error?.message ||
      '';
    const mensagemSemInvalidGrant = String(mensagem)
      .replace(/^invalid_grant[:\s-]*/i, '')
      .trim();

    if (error?.status === 401) {
      return mensagemSemInvalidGrant || 'Usuário ou senha inválidos.';
    }

    return mensagemSemInvalidGrant || 'Não foi possível realizar o login.';
  }

  private getPasswordChangeErrorMessage(error: any): string {
    const mensagem =
      error?.error?.message ||
      error?.error?.detailedMessage ||
      error?.message ||
      error?.error?.error ||
      '';
    return String(mensagem).trim() || 'Não foi possível alterar a senha.';
  }

  private isPasswordChangeRequiredError(error: any): error is PasswordChangeRequiredError {
    if (!error) return false;
    if (error.code === 'PASSWORD_CHANGE_REQUIRED') return true;

    const status = Number(error?.status ?? error?.error?.status ?? 0);
    const mensagem = String(
      error?.error?.message ||
        error?.error?.detailedMessage ||
        error?.message ||
        error?.error?.error_description ||
        error?.error?.error ||
        '',
    ).toLowerCase();
    const url = String(error?.url || error?.error?.url || '').toLowerCase();

    return (
      status === 302 ||
      mensagem.includes('senha expirada') ||
      mensagem.includes('password expired') ||
      mensagem.includes('troca de senha') ||
      url.includes('/api/framework/v1/changepassworduserservice')
    );
  }

  private openPasswordChangeModal(error: PasswordChangeRequiredError): void {
    this.pendingLogin = {
      username: error.user,
      password: error.oldPassword,
      anomimo: false,
    };
    this.passwordChangeForm = {
      user: error.user,
      oldPassword: error.oldPassword,
      newPassword: '',
      confirmPassword: '',
    };
    this.passwordChangeError = '';
    this.passwordChangeLoading = false;
    this.passwordChangeOpen = true;
  }

  private syncAnonButtonToSubmit(): void {
    const submitButton = document.querySelector('.po-page-login-button .po-button') as HTMLElement | null;
    if (!submitButton) return;

    const rect = submitButton.getBoundingClientRect();
    this.anonButtonStyle = {
      left: `${rect.left + rect.width / 2}px`,
      top: `${rect.bottom + 8}px`,
      width: `${rect.width}px`,
      '--anon-height': `${rect.height}px`,
    };
  }
}
