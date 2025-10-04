# NestJS Backend Complete Guide

## 📋 Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [File Structure Explained](#file-structure-explained)
3. [Request Lifecycle](#request-lifecycle)
4. [Authentication System](#authentication-system)
5. [Database Operations](#database-operations)
6. [Security Implementation](#security-implementation)
7. [API Endpoints](#api-endpoints)
8. [Configuration](#configuration)

---

## 🏗️ Architecture Overview

### The Big Picture

```
┌─────────────────────────────────────────────────────────────┐
│                         CLIENT                               │
│              (Frontend: React/Vue/etc)                       │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTP Request
                     │ (with cookies)
                     ↓
┌─────────────────────────────────────────────────────────────┐
│                      MAIN.TS                                 │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ - CORS Middleware (allows frontend)                 │   │
│  │ - Cookie Parser (reads JWT from cookies)            │   │
│  │ - Validation Pipe (validates DTOs)                  │   │
│  │ - Swagger Setup (API docs)                          │   │
│  └─────────────────────────────────────────────────────┘   │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────────┐
│                    APP.MODULE.TS                             │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐   │
│  │ ConfigModule │  │ TypeORM      │  │ Feature Modules │   │
│  │ (.env vars)  │  │ (Postgres)   │  │ (Auth, Users)   │   │
│  └──────────────┘  └──────────────┘  └─────────────────┘   │
└────────────────────┬────────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        ↓                         ↓
┌──────────────────┐    ┌──────────────────┐
│   AUTH MODULE    │    │   USERS MODULE   │
│                  │    │                  │
│  - Controller    │    │  - Service       │
│  - Service       │◄───┤  - Entity        │
│  - Guards        │uses│  - Repository    │
│  - Strategies    │    │                  │
│  - DTOs          │    │                  │
└──────────────────┘    └─────────┬────────┘
                                  │
                                  ↓
                        ┌──────────────────┐
                        │   DATABASE       │
                        │   (PostgreSQL)   │
                        └──────────────────┘
```

---

## 📂 File Structure Explained

### Complete File Tree

```
immo_project_backend/
│
├── .env                          # Environment variables (DB, JWT secrets)
├── .env.example                  # Template for environment variables
├── package.json                  # Dependencies and scripts
├── tsconfig.json                 # TypeScript configuration
├── nest-cli.json                 # NestJS CLI configuration
│
└── src/
    │
    ├── main.ts                   # 🚀 APPLICATION ENTRY POINT
    │                             # - Bootstraps the app
    │                             # - Configures middleware
    │                             # - Starts HTTP server
    │
    ├── app.module.ts             # 🏠 ROOT MODULE
    │                             # - Imports all feature modules
    │                             # - Configures database connection
    │                             # - Sets up global configuration
    │
    ├── app.controller.ts         # 📡 Root API endpoint (optional)
    ├── app.service.ts            # ⚙️ Root service (optional)
    │
    ├── auth/                     # 🔐 AUTHENTICATION MODULE
    │   │
    │   ├── auth.module.ts        # Module configuration
    │   │                         # - Imports UsersModule, JwtModule, PassportModule
    │   │                         # - Provides AuthService, JwtStrategy
    │   │
    │   ├── auth.controller.ts    # 🎯 HTTP ENDPOINTS
    │   │                         # Routes:
    │   │                         # - POST /auth/register
    │   │                         # - POST /auth/login (sets cookie)
    │   │                         # - POST /auth/logout (clears cookie)
    │   │                         # - GET /auth/me (protected)
    │   │
    │   ├── auth.service.ts       # 💼 BUSINESS LOGIC
    │   │                         # Methods:
    │   │                         # - register(dto) → Creates user
    │   │                         # - login(dto) → Validates & returns JWT
    │   │                         # - validateUser(id) → Checks if user exists
    │   │
    │   ├── dto/
    │   │   ├── login.dto.ts      # ✅ Login validation schema
    │   │   │                     # - email: must be valid email
    │   │   │                     # - password: min 6 chars
    │   │   │
    │   │   └── register.dto.ts   # ✅ Registration validation schema
    │   │                         # - email: must be valid email
    │   │                         # - password: min 6 chars
    │   │                         # - firstName, lastName: optional
    │   │
    │   ├── guards/
    │   │   └── jwt-auth.guard.ts # 🛡️ ROUTE PROTECTION
    │   │                         # - Extends AuthGuard('jwt')
    │   │                         # - Used with @UseGuards() decorator
    │   │                         # - Returns 401 if no valid JWT
    │   │
    │   └── strategies/
    │       └── jwt.strategy.ts   # 🔑 JWT VALIDATION LOGIC
    │                             # - Extracts JWT from cookies
    │                             # - Validates signature with JWT_SECRET
    │                             # - Fetches user from database
    │                             # - Attaches user to request object
    │
    └── users/                    # 👥 USERS MODULE
        │
        ├── users.module.ts       # Module configuration
        │                         # - Imports TypeORM for User entity
        │                         # - Exports UsersService (for AuthModule)
        │
        ├── users.service.ts      # 💾 DATABASE OPERATIONS
        │                         # Methods:
        │                         # - create() → Creates new user
        │                         # - findByEmail() → Finds user by email
        │                         # - findById() → Finds user by ID
        │                         # - validatePassword() → Compares passwords
        │
        └── entities/
            └── user.entity.ts    # 🗄️ DATABASE SCHEMA
                                  # Table: users
                                  # Columns:
                                  # - id (UUID, primary key)
                                  # - email (unique)
                                  # - password (hashed)
                                  # - firstName, lastName
                                  # - createdAt, updatedAt
```


## 🧪 Testing with Swagger

1. **Start server:**
   ```bash
   npm run start:dev
   ```

2. **Open Swagger UI:**
   ```
   http://localhost:3000/api
   ```

3. **Test flow:**
   - Click on `POST /auth/register` → Try it out → Execute
   - Click on `POST /auth/login` → Try it out → Execute
   - Click on `GET /auth/me` → Try it out → Execute (uses cookie automatically)

---

## 🎯 Key Concepts Summary

| Concept | File | Purpose |
|---------|------|---------|
| **Entry Point** | `main.ts` | Bootstraps app, configures middleware |
| **Root Module** | `app.module.ts` | Imports all feature modules |
| **Controller** | `*.controller.ts` | Handles HTTP requests (routes) |
| **Service** | `*.service.ts` | Business logic & database operations |
| **Entity** | `*.entity.ts` | Database table schema |
| **DTO** | `*.dto.ts` | Input validation |
| **Guard** | `*.guard.ts` | Route protection |
| **Strategy** | `*.strategy.ts` | Authentication logic (JWT validation) |
| **Module** | `*.module.ts` | Groups related features together |

---

## 🚀 Next Steps

1. ✅ Make sure PostgreSQL is running
2. ✅ Copy `.env.example` to `.env` and update values
3. ✅ Run `npm install`
4. ✅ Run `npm run start:dev`
5. ✅ Visit `http://localhost:3000/api` for Swagger
6. ✅ Test endpoints with Swagger UI

---

## 🔗 File Connections Cheat Sheet

```
main.ts
  └─ imports AppModule

AppModule
  ├─ imports ConfigModule (env vars)
  ├─ imports TypeOrmModule (database)
  ├─ imports AuthModule
  └─ imports UsersModule

AuthModule
  ├─ imports UsersModule (to access UsersService)
  ├─ imports JwtModule (to sign tokens)
  ├─ provides AuthService
  ├─ provides JwtStrategy
  └─ exports nothing (controllers handle everything)

UsersModule
  ├─ imports TypeOrmModule.forFeature([User])
  ├─ provides UsersService
  └─ exports UsersService (for AuthModule)

Request Flow:
Client → main.ts → AppModule → AuthController → AuthService → UsersService → Database
```

---
