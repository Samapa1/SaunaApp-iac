import { APIGatewayProxyHandler } from "aws-lambda"
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { DateTime } from 'luxon';
import authorize from "../../utils/functions/authorization";
import { CognitoAccessTokenPayload } from "aws-jwt-verify/jwt-model";

export const client = DynamoDBDocumentClient.from(new DynamoDBClient({
    // endpoint: 'http://dynamodb:8000'
}));

const createResponse = (statusCode: number, message: string) => ({
    headers: {
        "Content-Type": "application/json"
    },
    body: JSON.stringify({ message }),
    statusCode
});

export const make_reservation: APIGatewayProxyHandler = async (event, context) => {
    console.log("make_reservation function");
    const authorizationHeader = event.headers['authorization'];

    let authorized: CognitoAccessTokenPayload

    try {
        authorized = await authorize(authorizationHeader);
        console.log('Authorization successful');
    } catch (error) {
        return createResponse(401, "Unauthorized");
    }

    if (!event.body) {
        return createResponse(400, "Please enter sauna and date");
    }

    const body = JSON.parse(event.body);

    try {
        const dateParts = body.date.split('-');
        const withoutHoursData = dateParts.slice(0, 3);
        const withoutHoursDataReversed = withoutHoursData.toReversed();
        const newWeekNumber = DateTime.fromISO(withoutHoursDataReversed.join('-')).weekNumber;
        const dateWithWeekNumber = `${withoutHoursDataReversed[0]}-${withoutHoursDataReversed[1]}-${newWeekNumber}-${withoutHoursDataReversed[2]}-${dateParts[3]}`;
        console.log(dateWithWeekNumber);

        const command = new PutCommand({
            TableName: "SaunaTable",
            Item: {
                Id: body.sauna,
                Date: dateWithWeekNumber,
                UserId: authorized.username
            },
            ConditionExpression: "attribute_not_exists(Id)"
        });

        await client.send(command);
        return createResponse(200, `Sauna ${body.sauna} reserved ${body.date}`);
    } catch (err: unknown) {
        if (err && err instanceof Error) {
            console.error('Error making reservation:', err);
            if (err.message === "The conditional request failed") {
                return createResponse(400, `Sauna ${body.sauna} already reserved ${body.date}`);
            }
        }
        return createResponse(500, "Something went wrong");
    }
};
