#!/usr/bin/env bash
mkdir -p dynamodb_data
docker network create lambda-local
docker run -p 8000:8000 --network=lambda-local --volume ./dynamodb_data:/home/dynamodblocal/data --name dynamodb amazon/dynamodb-local  -jar DynamoDBLocal.jar -sharedDb -dbPath /home/dynamodblocal/data/
