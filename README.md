# Sample shop app using Fauna

## Overview
This is the backend/API service for a sample e-commerce application built with the Fastify framework, using [Fauna](http://fauna.com/) for data storage. The `/src/modules` directory represents domain entities, with each module having its own `.repository.ts` file where the FQL (Fauna's eDSL) queries live. The `src/db` folder contains scripts and constants used during the `npm run bootstrap` command to set up the app's schema and seed some sample data.

## Instructions

### 1. Set up the backend service
* Clone the repo: `git clone https://github.com/fauna-labs/fauna-shopapp-fastify.git`
* Open the project folder: `cd faunadb-nodejs-shop-app`
* Install dependencies: `npm i`
* Rename `.env.sample` to `.env`: `mv .env.sample .env`
* [Sign up](https://dashboard.fauna.com/accounts/register) or [log in](https://dashboard.fauna.com/accounts/login) at [dashboard.fauna.com](https://dashboard.fauna.com/accounts/register).
  * Click [CREATE DATABASE], name it "shopapp", select a region group (e.g., "Classic"), and click [CREATE].
  * Click the [SECURITY] tab at the bottom of the left sidebar, and [NEW KEY].
  * Create a Key with the default Role of "Admin" selected, and paste the secret into into your `.env` file's `FAUNA_SECRET_ADMIN_KEY`.
  * Create another key, but this time select "Server" from the "Role" dropdown. Paste the secret into your `.env` file's `FAUNA_SECRET_SERVER_KEY` field.
  * Optionally, change `.env`'s manager credentials. These are only used by the backend; the frontend will use customer credentials.
* Return to the terminal and run `npm run bootstrap` to set up your database schema and seed some sample data, including customer credentials for logging into the frontend app. Check your terminal's output log for these customer credentials, and copy them down somewhere for Step 3.

```
Use these sample customer credentials to log into the frontend React app:
  - phone: 12020000000
  - password: <unique value>
```

### 2. Try out the backend API service via the Swagger docs

* Run `npm start` to start the backend service.
* Open the Swagger documentation at [http://localhost:4000/docs](http://localhost:4000/docs).
* Open the "POST: /users/login" accordion, and click [Try it out] to edit the request body's `phone` and `password` fields to reflect the values in your `.env` file.
* Click [Execute]. You should receive a 200 response with an `authorization` field. Copy the value of the authorization field to your clipboard.
* Scroll to the top of the page, click [Authorize] on the top right, paste the value, click [Authorize]. You should now be able to run queries available to the manager role.
  * For example, open the "POST /categories" accordion, click [Try it out], change the value of the `name` field from "string" to "more stuff", and click [Execute]. If you browse to your "Categories" collection in the Fauna dashboard, you should see a new category named "more stuff".
  * If you receive a 401 upon executing a request, that means the manager role does not have permission to execute that request.

### 3. Set up the frontend app
* Clone the client repo: `git clone https://github.com/tigger9flow/faunadb-react-shop-app.git`
* `cd faunadb-react-shop-app`
* Install dependencies: `npm i`
* Serve a client app locally: `npm start`
* Sign in using the sample customer credentials generated during the `npm run bootstrap` command from Step 1 (phone number should be "12020000000").
