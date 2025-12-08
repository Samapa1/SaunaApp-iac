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
        const dateParts = r.Date.split('-')
        return ({
            Id: r.Id,
            Date: `${dateParts[3]}-${dateParts[1]}-${dateParts[0]}-${dateParts[4]}`
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

