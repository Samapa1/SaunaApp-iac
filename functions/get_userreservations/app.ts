import { APIGatewayProxyHandler } from "aws-lambda"
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { DateTime } from "luxon";
import { CognitoAccessTokenPayload } from "aws-jwt-verify/jwt-model";
import authorize from "../../utils/functions/authorization";

interface Reservation {
    Id: string;
    Date: string;
    UserId: string;
}

export const client = DynamoDBDocumentClient.from(new DynamoDBClient({
    endpoint: process.env.ENDPOINT
}));

const createResponse = (statusCode: number, message: string | object) => ({
    headers: {
        "Content-Type": "application/json"
    },
    body: JSON.stringify(typeof message === 'string' ? { message } : message),
    statusCode
});

export const get_userReservations: APIGatewayProxyHandler = async (event, context) => {
    console.log("get_userreservations function");
    const authorizationHeader = event.headers['Authorization'];

    let authorized: CognitoAccessTokenPayload;

    try {
        authorized = await authorize(authorizationHeader);
        console.log('Authorization successful');
    } catch (error) {
        return createResponse(401, "Unauthorized");
    }

    const getuserReservations = async (dateData: string, sauna: number): Promise<Reservation[]> => {
        const nextQueryInput = {
            TableName: 'SaunaTable',
            KeyConditionExpression: 'Id = :id and begins_with(#dynamoDate, :date)',
            FilterExpression: 'UserId = :authorizedUserId',
            ExpressionAttributeValues: {
                ':id': sauna.toString(),
                ':date': `${dateData}-`,
                ':authorizedUserId': authorized.username
            },
            ExpressionAttributeNames: { "#dynamoDate": "Date" }
        };

        const command = new QueryCommand(nextQueryInput);
        const response = await client.send(command);
        return response.Items as Reservation[];
    };

    const formatResult = (allItems: Reservation[]) => {
 
        const resultFormatted = allItems.map(r => {
            const dateParts = r.Date.split('-');
            return ({
                Id: r.Id,
                Date: `${dateParts[3]}-${dateParts[1]}-${dateParts[0]}-${dateParts[4]}`
            });
        });
        return resultFormatted;
    };

    const dateData = event.queryStringParameters?.date;
    if (!dateData) {
        return createResponse(400, "No date provided");
    }

    try {
        let sauna = 1
        const allReservations: Reservation[] = [];
        while ( sauna <= 5 ) {
            const retrievedItems = await getuserReservations(dateData, sauna);
            allReservations.push(...(retrievedItems || []));
            sauna++;
        }
        const formattedResult = formatResult(allReservations);
        return createResponse(200, formattedResult);
    } catch (err) {
        console.error('Error fetching reservations:', err);
        return createResponse(500, "Something went wrong");
    }
};


