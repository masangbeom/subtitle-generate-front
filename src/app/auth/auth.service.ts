import {Injectable} from "@angular/core";
import {AuthenticationDetails, CognitoRefreshToken, CognitoUser, CognitoUserPool} from "amazon-cognito-identity-js";
import {EnvService} from "../env.service";
import * as AWS from "aws-sdk";
import {Router} from "@angular/router";

@Injectable()
export class AuthService {
  public jwtToken: string;
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

  public getUserName(): string {
    return this.user.getUsername();
  }

  public signOut() {
    this.user.signOut();
  }

  async setCredentials(): Promise<void> {
    return new Promise(resolve => {
      if (!this.user) {
        this.router.navigate(['/signin'])
        resolve();
      } else {
        this.user.getSession((err, session) => {
          if (err || !session) {
            this.router.navigate(['/signin'])
            resolve();
          } else {
            if (session.isValid()) {
              this.jwtToken = session.getIdToken().getJwtToken();
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
                resolve();
              });
            } else {
              const token = new CognitoRefreshToken({RefreshToken: session.getRefreshToken().getToken()});
              this.user.refreshSession(token, (err, session) => {
                if (err) this.router.navigate(['/signin'])
                else this.setCredentials();
              })
              this.router.navigate(['/signin'])
              resolve();
            }
          }
        })
      }
    })
  }
}
