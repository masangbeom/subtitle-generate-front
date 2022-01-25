import { Injectable } from '@angular/core';

@Injectable()
export class EnvService {
  // The values that are defined here are the default values that can
  // be overridden by env.js

  // API url
  // public ApiUrl = '';
  // public AssetsDistributionUrl = '';
  // public AssetsBucketName = '';
  // public UserPoolId = '';
  // public UserPoolClientId = '';
  // public IdentityPoolId = '';
  // public Region = '';

  public ApiUrl = 'https://wmqrxbay48.execute-api.ap-northeast-2.amazonaws.com/prod/';
  public AssetsDistributionUrl = 'https://dqfm0guvw2y3h.cloudfront.net';
  public AssetsBucketName = 'sharedstack-videobucket6ed8e1af-1cvmhkt1zqv7q';
  public UserPoolId = 'ap-northeast-2_bKjgCbAtp';
  public UserPoolClientId = '5np7j6mu4tb7mctt8e51rot36k';
  public IdentityPoolId = 'ap-northeast-2:bd7cc20d-f134-41f9-a88f-c936f58e0bc7';
  public Region = 'ap-northeast-2';

  constructor() { }
}
