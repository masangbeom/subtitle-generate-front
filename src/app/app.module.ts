import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {AppComponent} from './app.component';
import {en_US, NZ_I18N} from 'ng-zorro-antd/i18n';
import {registerLocaleData} from '@angular/common';
import en from '@angular/common/locales/en';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {HttpClientModule} from '@angular/common/http';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {RouterModule, Routes} from "@angular/router";
import {MainComponent} from './main/main.component';
import {SignInComponent} from "./auth/signin/sign-in.component";
import {SignUpComponent} from "./auth/signup/sign-up.component";
import {NzCheckboxModule} from "ng-zorro-antd/checkbox";
import {NzGridModule} from "ng-zorro-antd/grid";
import {NzCardModule} from "ng-zorro-antd/card";
import {NzInputModule} from "ng-zorro-antd/input";
import {NzIconModule} from "ng-zorro-antd/icon";
import {NzDividerModule} from "ng-zorro-antd/divider";
import {NzModalModule} from "ng-zorro-antd/modal";
import {NzButtonModule} from "ng-zorro-antd/button";
import {NzUploadModule} from "ng-zorro-antd/upload";
import {NzMessageModule} from "ng-zorro-antd/message";
import {NzStepsModule} from "ng-zorro-antd/steps";
import {NzSpinModule} from "ng-zorro-antd/spin";
import {NzTagModule} from "ng-zorro-antd/tag";
import {NzRadioModule} from "ng-zorro-antd/radio";
import {NzFormModule} from "ng-zorro-antd/form";
import {NzPopconfirmModule} from "ng-zorro-antd/popconfirm";
import {NzNotificationModule} from "ng-zorro-antd/notification";
import {VerificationCodeComponent} from "./auth/verification-code/verification-code.component";
import {AuthService} from "./auth/auth.service";
import {FilterPipeModule} from "ngx-filter-pipe";
import {NgxSpinnerModule} from "ngx-spinner";
import {NzListModule} from "ng-zorro-antd/list";
import {AppService} from "./app.service";
import {EnvServiceProvider} from "./env.service.provider";
import {NzSelectModule} from "ng-zorro-antd/select";
import { VideoPlayerComponent } from './video-player/video-player.component';

registerLocaleData(en);
const routes: Routes = [
  {
    path: '',
    component: AppComponent,
    children: [
      {
        path: '',
        component: MainComponent,
      },
      {
        path: 'signin',
        component: SignInComponent,
      },
      {
        path: 'signup',
        component: SignUpComponent,
      },
      {
        path: 'verification',
        component: VerificationCodeComponent,
      },
      {
        path: 'verification/:username',
        component: VerificationCodeComponent,
      }
    ]
  },
  {path: '**', redirectTo: '/'}
];

@NgModule({
  declarations: [
    AppComponent,
    MainComponent,

    VideoPlayerComponent,
    SignInComponent,
    SignUpComponent,
    VerificationCodeComponent,
    VideoPlayerComponent,
  ],
  imports: [
    RouterModule.forRoot(routes),
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    BrowserAnimationsModule,
    NgxSpinnerModule,
    FilterPipeModule,

    NzCheckboxModule,
    NzGridModule,
    NzCardModule,
    NzInputModule,
    NzSelectModule,
    NzIconModule,
    NzDividerModule,
    NzModalModule,
    NzButtonModule,
    NzUploadModule,
    NzMessageModule,
    NzStepsModule,
    NzSpinModule,
    NzTagModule,
    NzRadioModule,
    NzFormModule,
    NzPopconfirmModule,
    NzListModule,
    NzNotificationModule,
  ],
  providers: [
    { provide: NZ_I18N, useValue: en_US },
    AuthService,
    AppService,
    EnvServiceProvider,
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
