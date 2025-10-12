import { CfnOutput, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { CorsHttpMethod, HttpApi } from 'aws-cdk-lib/aws-apigatewayv2';
import { HttpLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import { HttpMethod } from 'aws-cdk-lib/aws-events';

export class SaunaAppStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

  // Create a Lambda function
    const myLambda = new lambda.Function(this, 'MyFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'app.lambda_handler',
      code: lambda.Code.fromAsset('./my_function/lib'),
    });

  // Create an API Gateway
    const httpApi = new HttpApi(this, "MyApi", {
      apiName: "My API",
      corsPreflight: {
        allowMethods: [
          CorsHttpMethod.GET,
          CorsHttpMethod.DELETE,
          CorsHttpMethod.PUT,
          CorsHttpMethod.POST,
        ],
        allowOrigins: ["*"],
      },
    });

    const templateLambdaIntegration = new HttpLambdaIntegration('TemplateIntegration', myLambda);

    // Create a resource and method for the API
    httpApi.addRoutes({
        path: '/invoke',
        methods: [ HttpMethod.GET],
        integration: templateLambdaIntegration,

    })

    // Output the API endpoint URL
    new CfnOutput(this, "ApiEndpoint", {
      value: httpApi.apiEndpoint,
    });

  }
}