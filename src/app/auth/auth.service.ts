import {Injectable} from "@angular/core";
import {AuthenticationDetails, CognitoUser, CognitoUserPool} from "amazon-cognito-identity-js";
import {EnvService} from "../env.service";
import * as AWS from "aws-sdk";
import {Router} from "@angular/router";

@Injectable()
export class AuthService {
  constructor(
    private readonly env: EnvService,
    private router: Router,
  ) {
  }
  public readonly userPoolData = {
    UserPoolId: this.env.UserPoolId, // Your user pool id here
    ClientId: this.env.UserPoolClientId // Your client id here
  };

  public get userPool(): CognitoUserPool {
    return new CognitoUserPool(this.userPoolData);
  }

  public authenticationDetails(Username: string, Password: string): AuthenticationDetails {
    return new AuthenticationDetails({Username, Password});
  }

  public getCognitoUser(Username: string): CognitoUser {
    return new CognitoUser({Username, Pool: this.userPool});
  }

  public get user(): CognitoUser | null {
    return this.userPool.getCurrentUser();
  }

  public signOut() {
    this.user.signOut();
  }

  setCredentials() {
    if (!this.user) {
      this.router.navigate(['/signin'])
    } else {
      this.user.getSession((err, session) => {
        if (err || !session) {
          this.router.navigate(['/signin'])
        } else {
          if (session.isValid()) {
            const credentialLogins = {};
            credentialLogins[`cognito-idp.${this.env.Region}.amazonaws.com/${this.env.UserPoolId}`] = session
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
          } else {
            this.user.refreshSession(session.getRefreshToken(), (err, session) => {
              if (err) this.router.navigate(['/signin'])
              else this.setCredentials();
            })
            this.router.navigate(['/signin'])
          }
        }
      })
    }
  }
}
