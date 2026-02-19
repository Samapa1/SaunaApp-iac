import * as dotenv from "dotenv";
import path = require("path");

// 1. Configure dotenv to read from our `.env` file
dotenv.config({ path: path.resolve(__dirname, "../.env") });

// 2. Define a TS Type to type the returned envs from our function below.
export type ConfigProps = {
  USER_POOL_ID: string;
  CLIENT_ID: string;
};

// 3. Define a function to retrieve our env variables
export const getConfig = (): ConfigProps => ({
  USER_POOL_ID: process.env.USER_POOL_ID || "",
  CLIENT_ID: process.env.CLIENT_ID || "",
});