import { APIGatewayProxyHandler } from "aws-lambda"
import { DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

export const client = DynamoDBDocumentClient.from(new DynamoDBClient({
    endpoint: 'http://dynamodb:8000'
}));

export const lambda_handler: APIGatewayProxyHandler = async (event, context) => {
    console.log("testing reservations function")
    console.log(event.queryStringParameters?.sauna)
    const sauna = event.queryStringParameters?.sauna
    const command = new ScanCommand({TableName: 'SaunaTable'});
    const response = await client.send(command);

    const retrievedItems = response.Items
    const reservationsForSauna = retrievedItems?.filter(r => {
        return (Number(r.Id.S) === Number(sauna))
    })

    const resultFormatted = reservationsForSauna?.map(r => {
        return ({
            Id: r.Id.S,
            Date: r.Date.S
        })
    } ) 
    console.log("Hello")

    return {
        headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Headers": "*"
        },
        body: JSON.stringify(resultFormatted),
        statusCode: 200
    }
}

