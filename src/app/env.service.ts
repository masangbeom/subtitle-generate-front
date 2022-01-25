import { Injectable } from '@angular/core';

@Injectable()
export class EnvService {
  // The values that are defined here are the default values that can
  // be overridden by env.js

  public ApiUrl = '';
  public AssetsDistributionUrl = '';
  public AssetsBucketName = '';
  public UserPoolId = '';
  public UserPoolClientId = '';
  public IdentityPoolId = '';
  public Region = '';

  constructor() { }
}
