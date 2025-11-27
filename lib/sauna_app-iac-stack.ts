import { CfnOutput, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { CorsHttpMethod, HttpApi } from 'aws-cdk-lib/aws-apigatewayv2';
import { HttpLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import { HttpMethod } from 'aws-cdk-lib/aws-events';

export class SaunaAppApiStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

  // Create Lambda functions
    const reservations = new lambda.Function(this, 'Reservations', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'app.lambda_handler',
      code: lambda.Code.fromAsset('./functions/get_reservations/lib'),
    });

    const makeReservation = new lambda.Function(this, 'MakeReservation', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'app.make_reservation',
      code: lambda.Code.fromAsset('./functions/make_reservations/lib'),
    });

    const deleteReservation = new lambda.Function(this, 'DeleteReservation', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'app.delete_reservation',
      code: lambda.Code.fromAsset('./functions/delete_reservation/lib'),
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
        // allowHeaders: ['Content-Type'],
        allowHeaders: ["*"],
        allowOrigins: ["*"],
      },
    });

    const reservationsLambdaIntegration = new HttpLambdaIntegration('ReservationsLambdaIntegration', reservations);
    const makeReservationLambdaIntegration = new HttpLambdaIntegration('MakeReservationLambdaIntegration', makeReservation);
    const deleteReservationLambdaIntegration = new HttpLambdaIntegration('DeleteReservationLambdaIntegration', deleteReservation);
    // Create a resource and method for the API

    httpApi.addRoutes({
        path: '/reservations',
        methods: [ HttpMethod.GET],
        integration: reservationsLambdaIntegration,
    })

    httpApi.addRoutes({
      path: '/reservation',
      methods: [ HttpMethod.POST],
      integration: makeReservationLambdaIntegration,
    })

    httpApi.addRoutes({
      path: '/reservation',
      methods: [ HttpMethod.DELETE],
      integration: deleteReservationLambdaIntegration,
    })

    // Output the API endpoint URL
    new CfnOutput(this, "ApiEndpoint", {
      value: httpApi.apiEndpoint,
    });

  }
}