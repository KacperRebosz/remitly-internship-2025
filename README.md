# Remitly 2025 Internship Task - SWIFT Codes API

<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

This project is a solution for the Remitly 2025 Internship Task, implementing a RESTful API using the [NestJS](https://nestjs.com/) framework to manage and query SWIFT/BIC code information. It utilizes PostgreSQL with Drizzle ORM for database interactions and includes Docker support for easy setup and deployment.

## Table of Contents

*   [Features](#features)
*   [Prerequisites](#prerequisites)
*   [Getting Started](#getting-started)
    *   [Cloning the Repository](#cloning-the-repository)
    *   [Environment Configuration](#environment-configuration)
*   [Running the Application Using Docker](#running-the-application-using-docker)
*   [API Documentation (Swagger)](#api-documentation-swagger)
*   [API Endpoints](#api-endpoints)
*   [Available Scripts](#available-scripts)
*   [Testing](#testing)

## Features

*   **CRUD Operations:** Create, Read, and Delete SWIFT code entries.
*   **Country Lookup:** Retrieve all SWIFT codes associated with a specific country ISO code.
*   **Detailed View:** Get detailed information for a specific SWIFT code, including branch/headquarter status and associated branches for HQs.
*   **Data Seeding:** Populate the database from a CSV file (#attachment/file:swift_codes_2025.csv).
*   **Validation:** Robust input validation using `class-validator` and custom rules.
*   **Database ORM:** Uses [Drizzle ORM](https://orm.drizzle.team/) for type-safe SQL database interactions.
*   **API Documentation:** Integrated [Swagger UI](https://swagger.io/tools/swagger-ui/) for easy API exploration and testing.
*   **Dockerized:** Includes `Dockerfile` and `docker-compose.yaml` for containerized development and deployment.
*   **Configuration Management:** Uses `@nestjs/config` for environment variable management.

## Prerequisites

*   [Git](https://git-scm.com/)
*   [Node.js](https://nodejs.org/) (v20.x recommended, as per `Dockerfile`)
*   [npm](https://www.npmjs.com/) (comes with Node.js)
*   [Docker](https://www.docker.com/) & [Docker Compose](https://docs.docker.com/compose/) (Required for Docker setup)
*   [PostgreSQL](https://www.postgresql.org/) Client (Optional, for direct DB access)

## Getting Started

### Cloning the Repository

```bash
git clone https://github.com/KacperRebosz/remitly-internship-2025.git
cd remitly-internship-2025
npm install
```

### Environment Configuration

1.  **Create `.env` file:** Copy the example file to create your local configuration.
    ```bash
    cp .env.example .env
    ```
2.  **Configure Variables:** Open the `.env` file (#attachment/file:.env) and adjust the settings if necessary. The defaults are generally suitable for the Docker setup, but you might need to change them for a local setup or if ports conflict.
    *   `DATABASE_URL`: The connection string for the PostgreSQL database. The default works with the `docker-compose.yaml` setup.
    *   `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`: Credentials used by Docker Compose to initialize the database container. Also used within `DATABASE_URL`.
    *   `PORT`: The port the NestJS application will listen on *inside the container*. Defaults to `3000`.
    *   `CSV_FILE_PATH`: Path to the SWIFT codes CSV file, relative to the project root. Defaults to `data/swift_codes_2025.csv`.

## Running the Application Using Docker

1.  **Build Containers:**
    ```bash
    docker compose build app
    ```
    This command will:
    *   Pull the `postgres:16-alpine` image.
    *   Create and start a PostgreSQL container named `swift_db_container_final` using credentials from `.env`.
    *   Build the NestJS application image using the `Dockerfile`.
    *   Create and start the application container named `swift_api_container_final`, linking it to the database.
    *   Map port `8080` on your host machine to port `3000` inside the app container (as defined in `docker-compose.yaml`).

2.  **Run Database Migrations (inside container):**
    ```bash
    docker compose run --rm app npm run db:migrate
    ```
    *   This executes the migration script within the running `app` container.

3.  **Seed the Database (inside container):**
    ```bash
    docker compose run --rm app npm run db:seed
    ```
    *   This executes the seeding script within the running `app` container, populating the database from the CSV file.
      
4.  **Start Containers:**
    ```bash
    docker compose up app
    ```

5.  **Access the Application:**
    *   API Base URL: `http://localhost:8080/api` (Note the `/api` global prefix set in `src/main.ts` (#attachment/file:main.ts) and the host port `8080` from `docker-compose.yaml`).
    *   Swagger UI: `http://localhost:8080/swagger`

6.  **Stopping the Containers:**
    ```bash
    docker compose down
    ```
    *   To remove the data volume as well (useful for a clean restart): `docker compose down -v`

## API Documentation (Swagger)

This project uses Swagger (OpenAPI) for API documentation. Once the application is running, you can access the interactive Swagger UI in your browser:

*   **Docker:** `http://localhost:8080/swagger`

The Swagger UI allows you to:

*   View all available API endpoints.
*   See request parameters, headers, and body schemas.
*   View response schemas and status codes.
*   Execute API requests directly from the browser.

Note: The base path for all API calls is `/api` (e.g., `/api/swift-codes/...`). Swagger UI automatically handles this prefix.

## API Endpoints

All endpoints are prefixed with `/api`.

*   `GET /swift-codes/country/:countryISO2code`
    *   Retrieves a list of SWIFT codes for the specified 2-letter country ISO code.
    *   Example: `/api/swift-codes/country/PL`
*   `GET /swift-codes/:swiftCode`
    *   Retrieves detailed information for a specific 11-character SWIFT code.
    *   If the code represents a headquarter (ends in 'XXX'), associated branch codes are included.
    *   Example: `/api/swift-codes/E2ETESTAXXX`
*   `POST /swift-codes`
    *   Creates a new SWIFT code entry.
    *   Requires a JSON request body matching the `CreateSwiftCodeDto`.
    *   Performs validation on the input data.
*   `DELETE /swift-codes/:swiftCode`
    *   Deletes the SWIFT code entry matching the provided 11-character code.
    *   Prevents deletion of a headquarter if it still has associated branches in the database.

## Available Scripts

Key scripts defined in `package.json` :

*   `npm run build`: Compiles the TypeScript source code to JavaScript in the `dist` folder.
*   `npm run start`: Starts the application from the `dist` folder (requires `build` first).
*   `npm run start:dev`: Starts the application in watch mode using `ts-node`.
*   `npm run start:prod`: Starts the application in production mode from `dist`.
*   `npm run test:e2e`: Runs Jest end-to-end tests.
*   `npm run db:generate`: Generates Drizzle migration files based on schema changes.
*   `npm run db:migrate`: Applies pending Drizzle migrations (runs compiled JS script).
*   `npm run db:seed`: Seeds the database from the CSV file (runs compiled JS script).
*   `npm run build:scripts`: Compiles only the TypeScript scripts (like seed, migrate) needed for execution.

## Testing

*   **End-to-End (E2E) Tests:** Run E2E tests located in the `test` directory (`*.e2e-spec.ts`). These tests run against a running instance of the application or a test setup. The configuration (`test/jest-e2e.json`) loads `.env` variables. Ensure your test environment database is correctly configured and accessible.
    ```bash
    # Ensure the app (or a test instance) is running and DB is accessible
    npm run test:e2e
    ```
