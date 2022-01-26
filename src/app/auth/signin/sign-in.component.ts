import {Component, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {environment} from "../../../environments/environment";
import {AuthService} from "../auth.service";
import {Router} from "@angular/router";
import * as AWS from 'aws-sdk';
import {EnvService} from "../../env.service";
import {NgxSpinnerService} from "ngx-spinner";
import {NzMessageService} from "ng-zorro-antd/message";
@Component({
  selector: 'app-signin',
  templateUrl: './sign-in.component.html',
  styleUrls: ['./sign-in.component.scss']
})
export class SignInComponent implements OnInit {
  appName = environment.appName;

  validateForm!: FormGroup;
  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService,
    private readonly spinner: NgxSpinnerService,
    private readonly nzMessageService: NzMessageService,
    private env: EnvService,
  ) {
  }

  ngOnInit(): void {
    this.spinner.hide();
    if (this.env.AssetsDistributionUrl && this.env.ApiUrl) {
    } else {
      this.router.navigate(['/']);
    }
      this.validateForm = this.fb.group({
      name: [null, [Validators.required]],
      password: [null, [Validators.required]],
    });
  }

  submitForm(): void {
    // tslint:disable-next-line:forin
    for (const i in this.validateForm.controls) {
      this.validateForm.controls[i].markAsDirty();
      this.validateForm.controls[i].updateValueAndValidity();
    }

    if (this.validateForm.valid) {
      this.spinner.show();
      const {name, password} = this.validateForm.getRawValue();
      const authenticationDetails = this.authService.authenticationDetails(name, password);
      const cognitoUser = this.authService.getCognitoUser(name);
      cognitoUser.authenticateUser(authenticationDetails, {
        onSuccess:  (result) => {
          this.authService.jwtToken = result.getIdToken().getJwtToken();
          const credentialLogins = {};
          credentialLogins[`cognito-idp.${this.env.Region}.amazonaws.com/${this.env.UserPoolId}`] = result
            .getIdToken()
            .getJwtToken();
          AWS.config.region = this.env.Region;
          const credentials = new AWS.CognitoIdentityCredentials({
            IdentityPoolId: this.env.IdentityPoolId,
            Logins: credentialLogins,
          });
          credentials.get(() => {
            AWS.config.credentials = credentials;
          });
          this.spinner.hide();
          this.router.navigate(['/']);
        },

        onFailure: (err) => {
          this.spinner.hide();
          this.nzMessageService.error(err.message || JSON.stringify(err), {nzDuration: 5000});
        },
      });
      // this.authService.login(loginDto).then(() => this.appService.loadingBehavior.next(false));
    }
  }
}
