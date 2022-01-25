import {Injectable} from '@angular/core';
import {HttpInterceptor, HttpRequest, HttpHandler, HttpEvent} from '@angular/common/http';
import {Observable, throwError} from 'rxjs';
import {catchError} from 'rxjs/operators';
import {NzMessageService} from 'ng-zorro-antd/message';
import {Router} from '@angular/router';
import {NgxSpinnerService} from "ngx-spinner";
import {AuthService} from "./auth/auth.service";
import {AppService} from "./app.service";

@Injectable()
export class HttpInterceptorService implements HttpInterceptor {
  constructor(
    private nzMessageService: NzMessageService,
    private authService: AuthService,
    private appService: AppService,
    private router: Router,
    private spinner: NgxSpinnerService,
  ) {
  }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const request: HttpRequest<any> = req.clone();
    return next.handle(request).pipe(catchError(e => {
      if (e.status === 401) {
        this.authService.signOut();
        this.router.navigate(['/signin']);
      }
      if (e.error && e.error.message) {
        this.nzMessageService.error(e.error.message, {nzDuration: 5000});
        this.spinner.hide();
      }
      return throwError(e);
    }));
  }
}
