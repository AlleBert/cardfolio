# Portfolio AI - Financial Management Application

## Overview

Portfolio AI is a modern full-stack financial portfolio management application that combines React frontend with Express backend and AI-powered investment analysis. The application enables users to track financial instruments, monitor real-time prices, and receive intelligent investment recommendations through OpenAI integration.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

The frontend is built with **React 18** using TypeScript and follows a component-based architecture:

- **UI Framework**: Utilizes shadcn/ui components built on Radix UI primitives for consistent, accessible design
- **Styling**: Tailwind CSS with custom design tokens and CSS variables for theming
- **State Management**: TanStack Query (React Query) for server state management with optimistic updates
- **Routing**: Wouter for lightweight client-side routing
- **Charts**: Chart.js for portfolio visualization and asset allocation displays
- **Forms**: React Hook Form with Zod validation for type-safe form handling

Key architectural decisions:
- Component isolation with clear separation of concerns
- Custom hooks for data fetching and business logic abstraction
- TypeScript for compile-time type safety
- Responsive design with mobile-first approach

### Backend Architecture

The backend uses **Express.js** with TypeScript in an ESM configuration:

- **API Design**: RESTful endpoints for portfolio and instrument management
- **Data Layer**: In-memory storage with interface-based design for easy database migration
- **Services Layer**: Modular services for financial data, AI analysis, and external API integration
- **Error Handling**: Centralized error handling with structured error responses
- **Development**: Vite integration for hot module replacement in development

Key architectural patterns:
- Repository pattern with IStorage interface for data abstraction
- Service layer separation for business logic
- Middleware-based request/response logging
- Environment-based configuration

### Database Design

Currently uses **in-memory storage** with a well-defined schema ready for PostgreSQL migration:

- **Instruments Table**: Stores financial instruments with price tracking
- **AI Analyses Table**: Stores portfolio analysis results and recommendations
- **Schema Validation**: Drizzle ORM with Zod for type-safe database operations

The application is configured for PostgreSQL with Drizzle ORM, using Neon Database as the intended provider.

### Authentication & Authorization

The application currently operates without authentication but includes session management infrastructure:
- Session handling with connect-pg-simple for PostgreSQL sessions
- Cookie-based session storage preparation
- User context structure ready for implementation

## External Dependencies

### Financial Data APIs

- **Yahoo Finance API**: Primary source for real-time stock prices and instrument validation
- **Alpha Vantage API**: Fallback provider for financial data when Yahoo Finance is unavailable
- Automatic failover between providers for reliability

### AI Services

- **OpenAI GPT-5**: Portfolio analysis and investment recommendations
- Custom prompts for financial analysis considering market conditions
- JSON-structured responses for consistent data handling

### Database & Infrastructure

- **Neon Database**: PostgreSQL-compatible serverless database (configured but not yet implemented)
- **Drizzle ORM**: Type-safe database operations with schema migrations
- **PostgreSQL**: Target database with prepared schema and migrations

### Development & Deployment

- **Vite**: Build tool and development server with HMR
- **Replit Integration**: Development environment optimization with runtime error handling
- **TypeScript**: End-to-end type safety across frontend, backend, and shared schemas

### UI & Design System

- **Radix UI**: Headless component primitives for accessibility
- **Tailwind CSS**: Utility-first CSS framework with custom design tokens
- **Lucide React**: Icon library for consistent iconography
- **Google Fonts**: DM Sans font family for typography

The architecture supports easy scaling from the current in-memory storage to full PostgreSQL implementation, with all necessary infrastructure and interfaces already in place.