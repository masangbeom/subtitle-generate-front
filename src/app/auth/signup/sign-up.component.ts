import { Component, OnInit } from '@angular/core';
import {FormBuilder, FormControl, FormGroup, Validators} from '@angular/forms';
import {Router} from "@angular/router";
import {AuthService} from "../auth.service";
import {environment} from "../../../environments/environment";
import {NzMessageService} from "ng-zorro-antd/message";
import {NgxSpinnerService} from "ngx-spinner";
import {EnvService} from "../../env.service";
import {CognitoUserAttribute} from "amazon-cognito-identity-js";

@Component({
  selector: 'app-signup',
  templateUrl: './sign-up.component.html',
  styleUrls: ['./sign-up.component.scss']
})
export class SignUpComponent implements OnInit {
  appName = environment.appName;

  validateForm!: FormGroup;
  constructor(
    private fb: FormBuilder,
    private router: Router,
    private env: EnvService,
    private readonly nzMessageService: NzMessageService,
    private readonly spinner: NgxSpinnerService,
    private authService: AuthService,
  ) {
  }

  ngOnInit(): void {
    if (this.env.AssetsDistributionUrl && this.env.ApiUrl) {
    } else {
      this.router.navigate(['/']);
    }
    this.validateForm = this.fb.group({
      name: [null, [Validators.required]],
      email: [null, [Validators.email, Validators.required]],
      password: [null, [Validators.required]],
      checkPassword: [null, [Validators.required, this.confirmationValidator]],
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
      const {name, email, password} = this.validateForm.getRawValue();
      this.authService.userPool.signUp(name, password,
        [new CognitoUserAttribute({ Name: 'email', Value: email })],
        [], (
        err,
        result
      ) => {
        this.spinner.hide();
        if (err) {
          this.nzMessageService.error(err.message || JSON.stringify(err), {nzDuration: 5000});
          return;
        }
        this.router.navigate(['/verification', result?.user.getUsername()]);
      });
    }
  }

  updateConfirmValidator(): void {
    /** wait for refresh value */
    Promise.resolve().then(() => this.validateForm.controls.checkPassword.updateValueAndValidity());
  }

  confirmationValidator = (control: FormControl): { [s: string]: boolean } => {
    if (!control.value) {
      return { required: true };
    } else if (control.value !== this.validateForm.controls.password.value) {
      return { confirm: true, error: true };
    }
    return {};
  }
}
