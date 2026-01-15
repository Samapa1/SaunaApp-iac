import { APIGatewayProxyHandler } from "aws-lambda"
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, DeleteCommand } from "@aws-sdk/lib-dynamodb";

export const client = DynamoDBDocumentClient.from(new DynamoDBClient({
    endpoint: 'http://dynamodb:8000'
}));

export const delete_reservation: APIGatewayProxyHandler = async (event, context) => {
    const sauna = event.queryStringParameters?.sauna
    const date = event.queryStringParameters?.date
    if (!sauna || !date) {
        return {
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Headers": "*"
            },
            body: JSON.stringify({message: "Please enter sauna and date"}),
            statusCode: 400
        }
    }

    const command = new DeleteCommand({
        TableName: "SaunaTable",
        Key: {
            Id: sauna,
            Date: date
        },
        ReturnValues: "ALL_OLD",
    })

    try{
        const response = await client.send(command);
        if (!response.Attributes) {
            return {
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Headers": "*"
                },
                body: JSON.stringify({message: `Reservation for sauna${sauna} ${date} not found.`}),
                statusCode: 404
            }
        }
        return {
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Headers": "*"
            },
            body: JSON.stringify({message: `Reservation for sauna${sauna} ${date} removed.`}),
            statusCode: 200
        }
    
    } catch(err: unknown) {
        if (err && err instanceof Error) {
            console.log(err)
        }
    }
    
    return {
        headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Headers": "*"
        },
        body: JSON.stringify({message: `Something went wrong`}),
        statusCode: 400
    }
}
