#!/usr/bin/env bash
aws dynamodb create-table --cli-input-json file://../json/create-sauna-table.json --endpoint-url http://localhost:8000
