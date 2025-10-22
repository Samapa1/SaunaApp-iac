import { APIGatewayProxyHandler } from "aws-lambda"
import { DynamoDBClient, DeleteItemCommand } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

export const client = DynamoDBDocumentClient.from(new DynamoDBClient({
    endpoint: 'http://dynamodb:8000'
}));

export const delete_reservation: APIGatewayProxyHandler = async (event, context) => {
    console.log("testing remove reservation function")
    const sauna = event.queryStringParameters?.sauna
    const date = event.queryStringParameters?.date
    if (!sauna || !date) {
        return {
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({message: "Please enter sauna and date"}),
            statusCode: 400
        }
    }
    const command = new DeleteItemCommand ({
        TableName: "SaunaTable",
        Key: {
            Id: {
                S: sauna
            },
            Date: {
                S: date
            }
        }
    });

    try{
        const response = await client.send(command);
        console.log(response)
        return {
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({message: `Reservation for ${sauna} ${date} removed.`}),
            statusCode: 200
        }
    
    } catch(err: unknown) {
        if (err && err instanceof Error) {
            console.log(err)
            // if (err.message === "The conditional request failed") {
            //     return {
            //         headers: {
            //             "Content-Type": "application/json"
            //         },
            //         body: JSON.stringify({message: `Sauna ${body.sauna} already reserved ${body.date} `}),
            //         statusCode: 400
            //     }
            // }
        }
    }
    
        return {
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({message: `Something went wrong`}),
            statusCode: 400
        }
}
