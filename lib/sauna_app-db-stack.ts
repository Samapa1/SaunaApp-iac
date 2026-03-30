import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { UserPool } from 'aws-cdk-lib/aws-cognito' 
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb'; 

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

  // Create DynamoDB table
  const SaunaTable = new dynamodb.TableV2(this, 'SaunaTable', {
    partitionKey: { name: 'Id', type: dynamodb.AttributeType.STRING },
    sortKey: { name: 'Date', type: dynamodb.AttributeType.STRING },
    tableName: 'SaunaTable'
  });

    // Define your constructs here

  }
}