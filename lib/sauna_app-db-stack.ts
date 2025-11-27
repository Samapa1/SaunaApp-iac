import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { UserPool } from 'aws-cdk-lib/aws-cognito'  

export class SaunaAppDBStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create UserPool
    const userPoolSaunojat = new UserPool(this, 'userPoolSaunojat', {
      // Methods in which a user registers or signs in to a user pool
      signInAliases: {
        email: true
      },
    })

    // Define your constructs here

  }
}