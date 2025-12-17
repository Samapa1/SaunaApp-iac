import { APIGatewayProxyHandler } from "aws-lambda"
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { DateTime } from "luxon";

export const client = DynamoDBDocumentClient.from(new DynamoDBClient({
    endpoint: 'http://dynamodb:8000'
}));

export const lambda_handler: APIGatewayProxyHandler = async (event, context) => {
    console.log("Testing getreservations function")
    const sauna = event.queryStringParameters?.sauna
    const dateData = event.queryStringParameters?.date 
    console.log("dateData" + dateData)
    console.log(dateData?.split('-')[0])
    console.log(dateData?.split('-')[2])
    const modifiedDateData = DateTime.fromObject({
        weekYear: Number(dateData?.split('-')[0])+1,
        weekNumber: Number(dateData?.split('-')[2])
        });
    const firstDayOfTheWeek= modifiedDateData.startOf('week');
    const lastDayOfTheWeek= firstDayOfTheWeek.plus({days: 6})

    const nextQueryInput = {
        TableName: 'SaunaTable',
        KeyConditionExpression: 'Id = :id and begins_with(#dynamoDate, :date)',
        ExpressionAttributeValues: {
            ':id': sauna,
            ':date': `${dateData}-`
        },  
        ExpressionAttributeNames: { "#dynamoDate": "Date" }
    }
    const command = new QueryCommand(nextQueryInput)
    const response = await client.send(command);

    if (firstDayOfTheWeek.month !== lastDayOfTheWeek.month) {
        console.log("different month")
        const nextmonthDateData = `${lastDayOfTheWeek.year}-0${lastDayOfTheWeek.month}-${dateData?.split('-')[2]}`
        const nextQueryInput = {
            TableName: 'SaunaTable',
            KeyConditionExpression: 'Id = :id and begins_with(#dynamoDate, :date)',
            ExpressionAttributeValues: {
                ':id': sauna,
                ':date': `${nextmonthDateData}-`
            },  
            ExpressionAttributeNames: { "#dynamoDate": "Date" }
        }
        const command = new QueryCommand(nextQueryInput)
        const nextResponse = await client.send(command);

        const retrievedItems = response.Items
        const allItems = [...(retrievedItems || []), ...(nextResponse.Items || [])];
        const reservationsForSauna = allItems?.filter(r => {
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

    } else {
        console.log("same month")
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

    
}

