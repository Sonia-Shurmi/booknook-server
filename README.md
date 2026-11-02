# BookNook – Backend API

BookNook's backend provides the REST API for managing books, user borrowing records, and book availability. It uses Express.js and MongoDB, with JWT authentication to protect private operations.

## Live API

[Add your deployed backend URL here]

## Features

- **Book Management:** Create, retrieve, update, and delete book records.
- **Book Listing:** Retrieve all books with support for limiting results.
- **Book Details:** Fetch individual book information by ID.
- **Borrow Books:** Allow authenticated users to borrow available books.
- **Return Books:** Process book returns and restore available copies.
- **Stock Management:** Update available book copies using atomic MongoDB operations.
- **Duplicate Borrow Prevention:** Prevent users from borrowing the same book more than once while an active borrow exists.
- **Ownership Protection:** Restrict book updates and deletion to their owners.
- **JWT Authentication:** Verify access tokens before allowing protected operations.
- **Input Validation:** Validate request data and return appropriate HTTP status codes.

## Technologies Used

- Node.js
- Express.js
- MongoDB
- MongoDB Native Driver
- JSON Web Token (JWT)
- Better Auth JWT
- CORS
- dotenv

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/books` | Get all books |
| GET | `/books/:id` | Get book details |
| POST | `/books` | Add a new book |
| PATCH | `/books/:id` | Update a book |
| DELETE | `/books/:id` | Delete a book |
| POST | `/borrows` | Borrow a book |
| GET | `/borrows` | Get current user's active borrows |
| DELETE | `/borrows/:id` | Return a borrowed book |

**Note:** Protected endpoints require a valid JWT access token in the Authorization header.

## Getting Started

### 1. Clone the repository

```bash
git clone YOUR_SERVER_REPOSITORY_URL
```

### 2. Navigate to the server directory

```bash
cd server
```

### 3. Install dependencies

```bash
npm install
```

### 4. Configure environment variables

Create a `.env` file in the server root directory:

```env
PORT=5000
MONGODB_URI=
CLIENT_URL=
AUTH_URL=
```

Add your own environment variable values. Never commit `.env` or expose secret credentials.

### 5. Run the development server

Start the server in development mode:

```bash
npm run dev
```

Or run it normally:

```bash
npm start
```

The local API will be available at:

`http://localhost:5000`

## Future Improvements

- **Advanced Search and Filtering:** Add more flexible book search and filtering capabilities.
- **Borrowing History:** Provide detailed records of completed and past borrow transactions.
- **Automated Reminders:** Support notifications for upcoming and overdue return dates.
- **Library Analytics:** Add statistics for popular books, active borrowers, and collection growth.
- **Admin Controls:** Introduce administrative tools for managing users and library collections.
- **Improved Transaction Safety:** Use MongoDB transactions for stronger consistency across borrowing and returning operations.
- **Rate Limiting:** Add API rate limiting to improve security and reliability.

## Project Purpose

The BookNook backend is designed to provide a secure and reliable foundation for an online library platform, making book management and borrowing operations simple and efficient.