# Sample shop app using Fauna

## Overview
This is a sample e-commerce application built on the Fastify framework and Fauna as a data storage.
The `/src/modules` directory represents domain entities, each of them has the `.repository.ts` file
where Fauna DSL queries live in. The `src/db` folder contains scripts and constants used for
setting up the initial app's structure.

## Installation
### API service
* first, create a Fauna database to be used by the app
* clone the repo: `git clone https://github.com/tigger9flow/faunadb-nodejs-shop-app.git`
* open project folder: `cd faunadb-nodejs-shop-app`
* install dependencies: `npm i`
* copy `.env.sample` as `.env` and fill up all properties. At this step, you should create
  admin and server keys and put them in the .env file. Also, fill up initial manager credentials to be able
  to login later
* run `npm run bootstrap` to initialize Fauna structures like collections, indexes and seed a sample data.
  This script creates a sample user that can be used to sign in via UI later. Check output logs for credentials
* run `npm start` to start a service
* open swagger documentation at <http://localhost:4000/docs>

### Client application
* clone the client repo: `git clone https://github.com/tigger9flow/faunadb-react-shop-app.git`
* `cd faunadb-react-shop-app`
* install dependencies: `npm i`
* serve a client app locally: `npm start`
* sign in using credentials generated during `npm run bootstrap` command
