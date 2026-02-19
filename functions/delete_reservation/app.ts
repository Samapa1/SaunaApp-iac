import { APIGatewayProxyHandler } from "aws-lambda"
import { DynamoDBClient, DeleteItemCommand } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import authorize from "../../utils/functions/authorization";

export const client = DynamoDBDocumentClient.from(new DynamoDBClient({
    endpoint: 'http://dynamodb:8000'
}));

const createResponse = (statusCode: number, message: string) => ({
    headers: {
        "Content-Type": "application/json"
    },
    body: JSON.stringify({ message }),
    statusCode
});

export const delete_reservation: APIGatewayProxyHandler = async (event, context) => {
    const authorizationHeader = event.headers['Authorization'];

    try {
        await authorize(authorizationHeader);
        console.log('Authorization successful');
    } catch (error) {
        return createResponse(401, "Unauthorized");
    }

    const sauna = event.queryStringParameters?.sauna;
    const date = event.queryStringParameters?.date;

    if (!sauna || !date) {
        return createResponse(400, "Please enter sauna and date");
    }

    const command = new DeleteItemCommand({
        TableName: "SaunaTable",
        Key: {
            Id: { S: sauna },
            Date: { S: date }
        },
        ReturnValues: "ALL_OLD",
    });

    try {
        const response = await client.send(command);
        
        if (!response.Attributes) {
            return createResponse(404, `Reservation for sauna ${sauna} ${date} not found.`);
        }

        return createResponse(200, `Reservation for sauna ${sauna} ${date} removed.`);
    } catch (err) {
        console.error('Error deleting reservation:', err);
        return createResponse(500, "Something went wrong");
    }
}
