# React-Python Fullstack Application

This is a full-stack application with a Python Flask backend and React TypeScript frontend, designed to manage permissions, roles, users, categories, and contacts.

## Tech Stack

### Backend
- Python 3
- Flask
- SQLAlchemy (ORM)
- Flask-Migrate (database migrations)
- Flask-RESTful (API endpoints)

### Frontend
- React
- TypeScript
- Vite (build tool)
- Shadcn/ui (UI components)
- Axios (HTTP client)

### Infrastructure
- Docker
- Docker Compose

## Getting Started

### Prerequisites
- Docker and Docker Compose installed
- Node.js (for frontend development)

### Installation

1. Clone the repository
2. Navigate to the project directory

### Running with Docker

```bash
docker-compose up --build
```

This will start:
- Backend server on port 5000
- Frontend server on port 5173
- Database service

### Development Setup

#### Backend
1. Navigate to `backend/`
2. Create a virtual environment:
   ```bash
   python -m venv venv
   venv\Scripts\activate  # On Windows
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Run the server:
   ```bash
   python main.py
   ```

#### Frontend
1. Navigate to `frontend/`
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```

## Project Structure

```
react-python/
├── backend/              # Flask backend
│   ├── app/              # Application code
│   ├── migrations/       # Database migrations
│   ├── static/           # Static files
│   ├── Dockerfile        # Backend Docker config
│   └── requirements.txt  # Python dependencies
├── frontend/            # React frontend
│   ├── src/             # Source code
│   ├── public/          # Public assets
│   ├── Dockerfile       # Frontend Docker config
│   └── package.json     # Frontend dependencies
└── docker-compose.yml   # Docker orchestration
```

## Features

- User authentication and authorization
- Role-based permissions
- Contact management
- Category management
- Audit logging
- Responsive UI

## API Documentation

API documentation is available via Swagger UI when running the backend:
`http://localhost:5000/swagger-ui`
