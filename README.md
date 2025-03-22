# Player Form API

A comprehensive backend API service for managing cricket player forms, achievements, and statistics.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [API Endpoints](#api-endpoints)
- [Data Models](#data-models)
- [Setup and Installation](#setup-and-installation)
- [Environment Variables](#environment-variables)
- [Running the Application](#running-the-application)
- [Testing](#testing)
- [Deployment](#deployment)
- [Security Features](#security-features)
- [Error Handling](#error-handling)

## Overview

This project provides a robust backend service for tracking cricket players' performance metrics, managing their profiles, and analyzing their form over time. It offers comprehensive API endpoints for creating, reading, updating, and deleting player information along with authentication and authorization capabilities.

## Features

- **Player Management**: CRUD operations for player profiles
- **Authentication & Authorization**: Secure routes with JWT token-based authentication
- **Form Statistics**: Track and analyze player performance metrics
- **Career Achievements**: Record notable accomplishments and milestones
- **Search & Filter**: Advanced query capabilities for searching players
- **Data Validation**: Strong validation for all incoming data
- **Error Handling**: Comprehensive error responses with appropriate status codes
- **Logging**: Detailed logging for debugging and monitoring

## Tech Stack

- **Node.js**: JavaScript runtime
- **Express.js**: Web application framework
- **MongoDB**: NoSQL database for data storage
- **Mongoose**: ODM library for MongoDB
- **JWT**: JSON Web Tokens for authentication
- **Bcrypt**: Password hashing
- **Joi**: Data validation
- **Morgan**: HTTP request logger
- **Winston**: Application logger
- **Jest**: Testing framework

## Project Structure

```
player-form-cc/
├── controllers/       # Route controllers
├── middlewares/       # Custom middleware functions
├── models/            # Mongoose models
├── routes/            # API routes
├── services/          # Business logic
├── utils/             # Utility functions
├── config/            # Configuration files
├── tests/             # Test files
├── logs/              # Application logs
├── .env               # Environment variables
└── server.js          # Entry point
```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login and get access token
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

### Players

- `GET /api/players` - Get all players
- `GET /api/players/:id` - Get player by ID
- `POST /api/players` - Create a new player
- `PUT /api/players/:id` - Update player by ID
- `DELETE /api/players/:id` - Delete player by ID

### Statistics

- `GET /api/players/:id/stats` - Get player statistics
- `POST /api/players/:id/stats` - Add player statistics
- `PUT /api/players/:id/stats/:statId` - Update player statistics
- `DELETE /api/players/:id/stats/:statId` - Delete player statistics

### Achievements

- `GET /api/players/:id/achievements` - Get player achievements
- `POST /api/players/:id/achievements` - Add player achievement
- `PUT /api/players/:id/achievements/:achievementId` - Update player achievement
- `DELETE /api/players/:id/achievements/:achievementId` - Delete player achievement

## Data Models

### User Model

```javascript
{
  username: String,
  email: String,
  password: String,
  role: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Player Model

```javascript
{
  name: String,
  dateOfBirth: Date,
  nationality: String,
  playerType: String,
  battingStyle: String,
  bowlingStyle: String,
  teams: [String],
  stats: [StatisticsSchema],
  achievements: [AchievementSchema],
  createdAt: Date,
  updatedAt: Date
}
```

### Statistics Schema

```javascript
{
  format: String,
  matches: Number,
  runs: Number,
  average: Number,
  strikeRate: Number,
  centuries: Number,
  fifties: Number,
  wickets: Number,
  economyRate: Number,
  year: Number
}
```

### Achievement Schema

```javascript
{
  title: String,
  description: String,
  date: Date,
  tournament: String
}
```

## Setup and Installation

1. Clone the repository:

   ```
   git clone https://github.com/yourusername/player-form-cc.git
   cd player-form-cc
   ```

2. Install dependencies:

   ```
   npm install
   ```

3. Set up environment variables (see [Environment Variables](#environment-variables))

4. Start MongoDB:
   ```
   mongod --dbpath /path/to/data/directory
   ```

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/player-form
JWT_SECRET=your_jwt_secret_key
NODE_ENV=development
LOG_LEVEL=info
```

## Running the Application

### Development Mode

```
npm run dev
```

### Production Mode

```
npm start
```

## Testing

```
npm test
```

## Deployment

### Docker

```
docker build -t player-form-api .
docker run -p 3000:3000 player-form-api
```

### Continuous Integration

The project uses GitHub Actions for CI/CD pipeline, automatically running tests and deploying to production when merging to the main branch.

## Security Features

- Password hashing with bcrypt
- JWT for secure authentication
- CORS protection
- Rate limiting to prevent brute force attacks
- Input validation and sanitization
- Environment variable protection
- Helmet.js for HTTP security headers

## Error Handling

The API uses a standardized error response format:

```json
{
  "status": "error",
  "code": 400,
  "message": "Validation error",
  "errors": ["Field 'name' is required"]
}
```

---

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
