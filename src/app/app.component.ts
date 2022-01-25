import {Component} from '@angular/core';
import {AuthService} from "./auth/auth.service";
import {EnvService} from "./env.service";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  constructor(
    private readonly authService: AuthService,
    private readonly env: EnvService,
  ) {
    if (this.env.AssetsDistributionUrl && this.env.ApiUrl) {
      this.authService.setCredentials();
    }
  }
}
