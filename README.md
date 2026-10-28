# E-Commerce Backend API

A RESTful backend API for an e-commerce application developed using Node.js, Express.js, and SQLite. This project demonstrates product management, order processing, input validation, error handling, and automated API testing.

## Project Overview

The E-Commerce Backend API provides endpoints for managing products and customer orders. It uses a lightweight SQLite database and exposes HTTP endpoints that can be accessed by frontend applications, mobile applications, or API testing tools.

This project was developed as an academic mini-project to demonstrate backend development concepts, REST API design, database integration, and software testing.

## Technologies Used

- **Node.js** — JavaScript runtime environment
- **Express.js** — Web application framework
- **SQLite** — Relational database
- **better-sqlite3** — SQLite database integration for Node.js
- **Automated testing** — Project test suite containing 18 tests

## Features

- API health-check endpoint
- Retrieve and create products
- Retrieve, update, and delete individual products
- Create and retrieve orders
- Input validation and error handling
- Request logging middleware
- Optional sample product data
- Demonstration script for API request and response workflows
- Automated API tests

## Project Structure

```text
_Source_Code/
├── README.md
├── package.json
├── .gitignore
├── scripts/
│   └── demo.js
├── src/
│   ├── app.js
│   ├── db.js
│   ├── errors.js
│   ├── seed.js
│   ├── server.js
│   ├── validators.js
│   ├── middleware/
│   │   └── requestLogger.js
│   └── routes/
│       ├── orders.js
│       └── products.js
└── tests/
    └── api.test.js
```

## Prerequisites

Install the following before running the project:

- Node.js
- npm (Node Package Manager)

Check whether they are installed:

```bash
node --version
npm --version
```

## Installation

Clone the repository:

```bash
git clone https://github.com/jravindranv/ecommerce-backend-api.git
```

Move into the project directory:

```bash
cd ecommerce-backend-api
```

Install the dependencies:

```bash
npm install
```

## Running the Application

Start the API server:

```bash
npm start
```

The server is expected to run at:

```text
http://localhost:3000
```

Check the API health endpoint:

```text
http://localhost:3000/api/health
```

You can open this URL in a browser while the server is running.

## API Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | Check API availability |
| GET | `/api/products` | Retrieve products |
| POST | `/api/products` | Create a product |
| GET | `/api/products/:id` | Retrieve a product by ID |
| PUT | `/api/products/:id` | Update a product |
| DELETE | `/api/products/:id` | Delete a product |
| GET | `/api/orders` | Retrieve orders |
| POST | `/api/orders` | Create an order |
| GET | `/api/orders/:id` | Retrieve an order by ID |

**Note:** The exact request body formats, validation rules, and response structures should be verified against the implementation in the source code.

## Sample Data

To insert the optional sample product data, run:

```bash
npm run seed
```

Use this command only when you want to populate the database with the project's sample data.

## Demonstration

The project includes a demonstration script that walks through API request and response examples.

Start the server in one terminal:

```bash
npm start
```

Open a second terminal in the project directory and run:

```bash
npm run demo
```

## Testing

Run the automated test suite:

```bash
npm test
```

The project is configured with 18 automated tests. Run the command to verify the actual results in your environment.

## Database

The application uses SQLite through the `better-sqlite3` package. Database initialization and data access are implemented in the source code.

Refer to `src/db.js` and `src/seed.js` for the database setup and sample data logic.

## Learning Outcomes

This project demonstrates practical concepts related to:

- RESTful API development
- HTTP methods and endpoint design
- Database integration
- CRUD operations
- Input validation and error handling
- Middleware implementation
- Automated testing
- Software project organization

## Limitations and Future Enhancements

Possible future enhancements include:

- User registration and authentication
- Role-based authorization
- Shopping cart functionality
- Payment gateway integration
- Product search and filtering
- API documentation using Swagger/OpenAPI
- Frontend integration
- Deployment to a hosting platform

These are potential enhancements and are not claimed as implemented features.

## Repository

GitHub: https://github.com/jravindranv/ecommerce-backend-api

## Intership Project

**Project Title:** E-Commerce Backend API  
**Project Type:** Academic Mini-Project  
**Technology Stack:** Node.js, Express.js, SQLite

