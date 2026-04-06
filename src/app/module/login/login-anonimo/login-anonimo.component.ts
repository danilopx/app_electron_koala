import { Component, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { LoginService } from "../../../service/login.service";
import { environment } from 'src/environments/environment';
import { firstValueFrom } from 'rxjs';
import { PoModalComponent } from '@po-ui/ng-components';


@Component({
  selector: 'app-login-anonimo',
  templateUrl: './login-anonimo.component.html',
  styleUrls: ['./login-anonimo.component.scss']
})
export class LoginAnonimoComponent {

  @ViewChild(PoModalComponent, { static: false }) poModal!: PoModalComponent;
  loading = false;

  constructor(
    private loginService: LoginService,
    private router: Router) { }



  async onAcessoSemLoginClick() {
    this.loading = true;

    const login = environment.admUser;
    const password = environment.pass;
    const anonimo = true;

    try {
      const retorno = await firstValueFrom(this.loginService.login(login, password, anonimo));
      if (retorno['access_token']) {

      //  this.loginService.setNextDataRefreshToken(retorno['expires_in']);
        this.router.navigate(['/home']);
      }
    } catch (error) {
      console.error('Login failed:', error);
    } finally {
      this.loading = false;
    }

  }
}
