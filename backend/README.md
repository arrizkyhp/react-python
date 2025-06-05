# Contact Management System - Backend

A RESTful API backend built with Python and Flask for managing contacts, users, roles, and permissions.

## Features

- **REST API**: JSON-based endpoints for all operations
- **Authentication**: JWT-based secure authentication
- **Database Models**: SQLAlchemy models for all entities
- **Role-Based Access**: Fine-grained permission control
- **Audit Logging**: Track all changes to data
- **Docker Support**: Containerized deployment

## Technology Stack

- **Framework**: Flask
- **Database**: SQLite (development), PostgreSQL (production)
- **ORM**: SQLAlchemy
- **Authentication**: Flask-JWT-Extended
- **API Documentation**: Swagger/OpenAPI
- **Containerization**: Docker

## API Structure

```
/api
├── /auth       - Authentication endpoints
├── /users      - User management
├── /roles      - Role management
├── /permissions - Permission management
├── /contacts   - Contact management
└── /categories - Category management
```

## Getting Started

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Set up database:
```bash
python seed_db.py
```

3. Start development server:
```bash
python main.py
```

4. API docs available at [http://localhost:5000/swagger](http://localhost:5000/swagger)

## Development Conventions

1. **Project Structure**:
   - `app/api/` - API endpoint controllers
   - `app/models/` - Database models
   - `app/utils/` - Utility functions
   - `migrations/` - Database migrations

2. **Code Style**:
   - Follow PEP 8 guidelines
   - Use type hints where applicable
   - Keep route handlers lean (move logic to separate functions)

3. **Testing**:
   - Write unit tests for all business logic
   - Test API endpoints with pytest

## Deployment

1. Build Docker image:
```bash
docker-compose build
```

2. Run with Docker:
```bash
docker-compose up
```

3. For production:
- Set `FLASK_ENV=production`
- Configure PostgreSQL connection
- Set proper JWT secret key

## Environment Variables

- `FLASK_ENV`: Development or production
- `DATABASE_URL`: Database connection string
- `JWT_SECRET_KEY`: Secret for JWT tokens
- `ADMIN_EMAIL`: Default admin email
- `ADMIN_PASSWORD`: Default admin password
