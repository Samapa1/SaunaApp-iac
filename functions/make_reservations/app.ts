import { APIGatewayProxyHandler } from "aws-lambda"
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { DateTime } from 'luxon';

export const client = DynamoDBDocumentClient.from(new DynamoDBClient({
    endpoint: 'http://dynamodb:8000'
}));

export const make_reservation: APIGatewayProxyHandler = async (event, context) => {
    console.log("make_reservation function")
    
    if (! event.body) {
        return {
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Headers": "*"
            },
            body: JSON.stringify({message: "Please enter sauna and date"}),
            statusCode: 400
        }
    }
    const body = JSON.parse(event.body)
    const dateParts = body.date.split('-')
    const withoutHoursData = dateParts.slice(0,3)
    const withoutHoursDataReversed = withoutHoursData.toReversed()
    const newWeekNumber = DateTime.fromISO(withoutHoursDataReversed.join('-')).weekNumber; 
    const dateWithWeekNumber = `${withoutHoursDataReversed[0]}-${withoutHoursDataReversed[1]}-${newWeekNumber}-${withoutHoursDataReversed[2]}-${dateParts[3]}`
    console.log(dateWithWeekNumber)
  
    const command = new PutCommand ({
        TableName: "SaunaTable",
        Item: {
            Id: body.sauna,
            Date: dateWithWeekNumber
        },
        ConditionExpression: "attribute_not_exists(Id)"
    });

    try{
    
        await client.send(command);
        return {
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Headers": "*"
            },
            body: JSON.stringify({message: `Sauna ${body.sauna} reserved ${body.date} `}),
            statusCode: 200
        }

    } catch(err: unknown) {
        if (err && err instanceof Error) {
            console.log(err)
            if (err.message === "The conditional request failed") {
                return {
                    headers: {
                        "Content-Type": "application/json",
                        "Access-Control-Allow-Headers": "*"
                    },
                    body: JSON.stringify({message: `Sauna ${body.sauna} already reserved ${body.date} `}),
                    statusCode: 400
                }
            }
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