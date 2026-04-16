import { CfnOutput, Fn, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaNode from 'aws-cdk-lib/aws-lambda-nodejs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { CorsHttpMethod, HttpApi } from 'aws-cdk-lib/aws-apigatewayv2';
import { HttpLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import { HttpMethod } from 'aws-cdk-lib/aws-events';

import { getConfig } from "./config";
const config = getConfig();

export class SaunaAppApiStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const SaunaTable = Fn.importValue('MySaunaTable')

    const reservations = new lambdaNode.NodejsFunction(this, 'Reservations', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'lambda_handler',
      entry: './functions/get_reservations/app.ts',
      environment: {
        USER_POOL_ID : config.USER_POOL_ID,
        CLIENT_ID: config.CLIENT_ID,
      },
    });

    // (reservations.node.defaultChild as lambda.CfnFunction).reservedConcurrentExecutions = 10;  

    const table = dynamodb.TableV2.fromTableName(this, 'Saunatable', SaunaTable)

    table.grant(reservations, "dynamodb:Query");

    const makeReservation = new lambdaNode.NodejsFunction(this, 'MakeReservation', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'make_reservation',
      entry: './functions/make_reservations/app.ts',
      environment: {
        USER_POOL_ID : config.USER_POOL_ID,
        CLIENT_ID: config.CLIENT_ID,
      },
    });

    table.grant(makeReservation, "dynamodb:PutItem");

    const deleteReservation = new lambdaNode.NodejsFunction(this, 'DeleteReservation', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'delete_reservation',
      entry: './functions/delete_reservation/app.ts',
      environment: {
        USER_POOL_ID : config.USER_POOL_ID,
        CLIENT_ID: config.CLIENT_ID,
      },
    });

    table.grant(deleteReservation, "dynamodb:DeleteItem");

    const userReservations = new lambdaNode.NodejsFunction(this, 'UserReservations', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'get_userReservations',
      entry: './functions/get_userreservations/app.ts',
      environment: {
        USER_POOL_ID : config.USER_POOL_ID,
        CLIENT_ID: config.CLIENT_ID,
      },
    });
    table.grant(userReservations, "dynamodb:Query");


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
    const userReservationsLambdaIntegration = new HttpLambdaIntegration('UserReservationsLambdaIntegration', userReservations); 

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

    httpApi.addRoutes({
      path: '/userreservations',
      methods: [ HttpMethod.GET],
      integration: userReservationsLambdaIntegration,
    })


    // Output the API endpoint URL
    new CfnOutput(this, "ApiEndpoint", {
      value: httpApi.apiEndpoint,
    });

  }
}