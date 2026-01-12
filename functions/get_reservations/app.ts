import { APIGatewayProxyHandler } from "aws-lambda"
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { DateTime } from "luxon";

export const client = DynamoDBDocumentClient.from(new DynamoDBClient({
    endpoint: 'http://dynamodb:8000'
}));

export const lambda_handler: APIGatewayProxyHandler = async (event, context) => {
    const sauna = event.queryStringParameters?.sauna

    const getReservations = async (data: string) => {    
        const nextQueryInput = {
            TableName: 'SaunaTable',
            KeyConditionExpression: 'Id = :id and begins_with(#dynamoDate, :date)',
            ExpressionAttributeValues: {
                ':id': sauna,
                ':date': `${data}-`
            },  
            ExpressionAttributeNames: { "#dynamoDate": "Date" }
        }
        
        const command = new QueryCommand(nextQueryInput)
        const response = await client.send(command);
        return response.Items
    }

    const formatResult = (allItems: any[]) => {   
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

     } 

    const dateData = event.queryStringParameters?.date 
    if (!dateData) 
          return {
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Headers": "*"
            },
            body: JSON.stringify("No date provided"),
            statusCode: 400
        }

    const modifiedDateData = DateTime.fromObject({
        weekYear: Number(dateData?.split('-')[0]),
        weekNumber: Number(dateData?.split('-')[2])
        });
    const firstDayOfTheWeek= modifiedDateData.startOf('week');
    const lastDayOfTheWeek= firstDayOfTheWeek.plus({days: 6})


    if (firstDayOfTheWeek.month !== lastDayOfTheWeek.month && dateData !== undefined) {
        const firstMonthDateData = `${firstDayOfTheWeek.year}-${String(firstDayOfTheWeek.month).padStart(2, '0')}-${firstDayOfTheWeek.weekNumber}`
        const firstResponseItems = await getReservations(firstMonthDateData);
        const nextmonthDateData = `${lastDayOfTheWeek.year}-${String(lastDayOfTheWeek.month).padStart(2, '0')}-${lastDayOfTheWeek.weekNumber}`
        const nextResponse = await getReservations(nextmonthDateData);
    
        const allItems = [...(firstResponseItems || []), ...(nextResponse || [])];
        const formattedResult = formatResult(allItems);
        return formattedResult;
   
    } else {
        const retrievedItems = await getReservations(dateData);
        const formattedResult = formatResult(retrievedItems || []);
        return formattedResult;

    } 

    
}

