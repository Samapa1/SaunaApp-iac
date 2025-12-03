import { APIGatewayProxyHandler } from "aws-lambda"
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";

export const client = DynamoDBDocumentClient.from(new DynamoDBClient({
    endpoint: 'http://dynamodb:8000'
}));

export const lambda_handler: APIGatewayProxyHandler = async (event, context) => {
    console.log("Testing getreservations function")
    const sauna = event.queryStringParameters?.sauna
    const command = new ScanCommand({TableName: 'SaunaTable'});
    const response = await client.send(command);

    const retrievedItems = response.Items
    const reservationsForSauna = retrievedItems?.filter(r => {
        return (Number(r.Id) === Number(sauna))
    })

    const resultFormatted = reservationsForSauna?.map(r => {
        return ({
            Id: r.Id,
            Date: r.Date
        })
    } ) 
 
    return {
        headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Headers": "*"
        },
        body: JSON.stringify(resultFormatted),
        statusCode: 200
    }
}

