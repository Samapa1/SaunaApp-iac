import { APIGatewayProxyHandler } from "aws-lambda"

export const lambda_handler: APIGatewayProxyHandler = async (event, context) => {
    console.log("testing")
    // return {
    //     result: "Hello from SAM and the CDK!"
    // }
    return {
        body: 'Response body',
        statusCode: 200
    }

    //return "Hello from SAM and the CDK!"
}