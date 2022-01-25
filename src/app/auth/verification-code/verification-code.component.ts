import { Component, OnInit } from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {ActivatedRoute, Router} from '@angular/router';
import {AuthService} from "../auth.service";
import {NzMessageService} from "ng-zorro-antd/message";
import {NgxSpinnerService} from "ngx-spinner";
import {EnvService} from "../../env.service";

@Component({
  selector: 'app-verfication-code',
  templateUrl: './verification-code.component.html',
  styleUrls: ['./verification-code.component.scss']
})
export class VerificationCodeComponent implements OnInit {
  validateForm!: FormGroup;
  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private env: EnvService,
    private readonly nzMessageService: NzMessageService,
    private readonly spinner: NgxSpinnerService,
  ) {
  }

  ngOnInit(): void {
    if (this.env.AssetsDistributionUrl && this.env.ApiUrl) {
    } else {
      this.router.navigate(['/']);
    }
    this.validateForm = this.fb.group({
      name: [this.route.snapshot.params.username, [Validators.email, Validators.required]],
      code: [null, [Validators.required]],
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
      const {name, code} = this.validateForm.getRawValue();
      const cognitoUser = this.authService.getCognitoUser(name);
      cognitoUser.confirmRegistration(code, false,(err, result) => {
        if (err) {
          this.nzMessageService.error(err.message || JSON.stringify(err), {nzDuration: 5000});
          return;
        }
        this.spinner.hide();
        this.router.navigate(["/"])
      })
    }
  }

  resendVerification(): void {
    const {name} = this.validateForm.getRawValue();
    this.spinner.show();
    const cognitoUser = this.authService.getCognitoUser(name);
    cognitoUser.resendConfirmationCode((err, result) => {
      if (err) {
        this.nzMessageService.error(err.message || JSON.stringify(err), {nzDuration: 5000});
        return;
      }
      this.spinner.hide();
      this.router.navigate(["/"])
    });
  }
}
