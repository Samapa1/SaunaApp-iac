import { APIGatewayProxyHandler } from "aws-lambda"
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import authorize from "../../utils/functions/authorization";
import { CognitoAccessTokenPayload } from "aws-jwt-verify/jwt-model";
import { DateTime } from "luxon";

export const client = DynamoDBDocumentClient.from(new DynamoDBClient(process.env.ENDPOINT ?{
    endpoint: process.env.ENDPOINT
} : {}));

const createResponse = (statusCode: number, message: string) => ({
    headers: {
        "Content-Type": "application/json"
    },
    body: JSON.stringify({ message }),
    statusCode
});

export const delete_reservation: APIGatewayProxyHandler = async (event, context) => {
    console.log("Delete reservation")
    const authorizationHeader = event.headers['authorization'] || event.headers['Authorization'];
    let authorized: CognitoAccessTokenPayload

    try {
        authorized = await authorize(authorizationHeader);
        console.log('Authorization successful');
    } catch (error) {
        return createResponse(401, "Unauthorized");
    }

    const sauna = event.queryStringParameters?.sauna;
    const date = event.queryStringParameters?.date;

     if (!sauna || !date) {
        return createResponse(400, "Please enter sauna and date");
    }

    const dateParts = date.split('-');
    const withoutHoursData = dateParts.slice(0, 3);
    const newWeekNumber = DateTime.fromISO(withoutHoursData.join('-')).weekNumber;
    const dateWithWeekNumber = `${withoutHoursData[0]}-${withoutHoursData[1]}-${newWeekNumber}-${withoutHoursData[2]}-${dateParts[3]}`;

    const reservationDateTime = DateTime.fromObject(
        { year: Number(dateParts[0]), month: Number(dateParts[1]), day: Number(dateParts[2]), hour: Number(dateParts[3]) },
        { zone: 'Europe/Helsinki' }
    );
    if (reservationDateTime <= DateTime.now().setZone('Europe/Helsinki')) {
        return createResponse(400, "Cannot delete a past reservation");
    }

    const command = new DeleteCommand({
        TableName: "SaunaTable",
        Key: {
            Id: sauna,
            Date: dateWithWeekNumber
        },
        ConditionExpression: "(attribute_not_exists(Id) AND attribute_not_exists(#Date)) OR UserId = :authorizedUserId",
        ExpressionAttributeValues: {
            ":authorizedUserId": authorized.username
        },
        ExpressionAttributeNames: {
            "#Date": "Date"
        },
        ReturnValues: "ALL_OLD",
    })

    try {
        const response = await client.send(command);
        
        if (!response.Attributes) {
            return createResponse(404, `Reservation for sauna ${sauna} ${date} not found.`);
        }
        return createResponse(200, `Reservation for sauna ${sauna} ${date} removed.`);
    } catch (err) {
        console.error('Error deleting reservation:', err);
        if (err instanceof Error) {
            if (err.name === "ConditionalCheckFailedException") {
                return createResponse(403, "You are not authorized to delete this reservation");
            }
        }
        return createResponse(500, "Something went wrong");
    }
    
}
