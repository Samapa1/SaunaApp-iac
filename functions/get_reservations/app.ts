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
    // endpoint: 'http://dynamodb:8000'
}));

const createResponse = (statusCode: number, message: string | object) => ({
    headers: {
        "Content-Type": "application/json"
    },
    body: JSON.stringify(typeof message === 'string' ? { message } : message),
    statusCode
});

export const lambda_handler: APIGatewayProxyHandler = async (event, context) => {
    console.log("get_reservations function");
    const sauna = event.queryStringParameters?.sauna;
    const authorizationHeader = event.headers['x-authorization'];

    let authorized: CognitoAccessTokenPayload;

    try {
        authorized = await authorize(authorizationHeader);
        console.log('Authorization successful');
    } catch (error) {
        return createResponse(401, "Unauthorized");
    }

    const getReservations = async (data: string): Promise<Reservation[]> => {
        const nextQueryInput = {
            TableName: 'SaunaTable',
            KeyConditionExpression: 'Id = :id and begins_with(#dynamoDate, :date)',
            ExpressionAttributeValues: {
                ':id': sauna,
                ':date': `${data}-`
            },
            ExpressionAttributeNames: { "#dynamoDate": "Date" }
        };

        const command = new QueryCommand(nextQueryInput);
        const response = await client.send(command);
        console.log("Query response:", response.Items);
        return response.Items as Reservation[];
    };

    const formatResult = (allItems: Reservation[], currentUserId: string) => {
        const reservationsForSauna = allItems?.filter(r => {
            return (Number(r.Id) === Number(sauna));
        });

        const resultFormatted = reservationsForSauna?.map(r => {
            const dateParts = r.Date.split('-');
            return ({
                Id: r.Id,
                Date: `${dateParts[3]}-${dateParts[1]}-${dateParts[0]}-${dateParts[4]}`,
                isOwnReservation: r.UserId === currentUserId
            });
        });

        return resultFormatted;
    };

    const dateData = event.queryStringParameters?.date;
    if (!dateData) {
        return createResponse(400, "No date provided");
    }
    try {
        const modifiedDateData = DateTime.fromObject({
            weekYear: Number(dateData?.split('-')[0]),
            weekNumber: Number(dateData?.split('-')[2])
        });
        const firstDayOfTheWeek = modifiedDateData.startOf('week');
        const lastDayOfTheWeek = firstDayOfTheWeek.plus({ days: 6 });

        if (firstDayOfTheWeek.month !== lastDayOfTheWeek.month) {
            const firstMonthDateData = `${firstDayOfTheWeek.year}-${String(firstDayOfTheWeek.month).padStart(2, '0')}-${firstDayOfTheWeek.weekNumber}`;
            const firstResponseItems = await getReservations(firstMonthDateData);
            const nextmonthDateData = `${lastDayOfTheWeek.year}-${String(lastDayOfTheWeek.month).padStart(2, '0')}-${lastDayOfTheWeek.weekNumber}`;
            const nextResponse = await getReservations(nextmonthDateData);

            const allItems = [...(firstResponseItems || []), ...(nextResponse || [])];
            const formattedResult = formatResult(allItems, authorized.username);
            return createResponse(200, formattedResult);
        } else {
            const retrievedItems = await getReservations(dateData);
            const formattedResult = formatResult((retrievedItems || []), authorized.username);
            return createResponse(200, formattedResult);
        }
    } catch (err) {
        console.error('Error fetching reservations:', err);
        return createResponse(500, "Something went wrong");
    }
};


