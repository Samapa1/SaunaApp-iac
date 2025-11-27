import { APIGatewayProxyHandler } from "aws-lambda"
import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

export const client = DynamoDBDocumentClient.from(new DynamoDBClient({
    endpoint: 'http://dynamodb:8000'
}));

export const make_reservation: APIGatewayProxyHandler = async (event, context) => {
    console.log("testing makereservation function")
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
    const command = new PutItemCommand ({
        TableName: "SaunaTable",
        Item: {
            Id: {
                S: body.sauna
            },
            Date: {
                S: body.date
            }
        },
        ConditionExpression: "attribute_not_exists(Id)"
    });

    try{
    
        const response = await client.send(command);
        console.log(response)
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