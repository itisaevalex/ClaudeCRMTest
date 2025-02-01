# CleanCRM

A modern, efficient CRM system designed specifically for cleaning businesses. Built with React, TypeScript, and Supabase.

## Features

- 📊 Customer Management
- 📅 Booking System
- 💰 Financial Tracking
- 💬 Communication Tools
- ⚙️ Business Settings
- 🔐 Secure Authentication

## Tech Stack

- Frontend:
  - React with TypeScript
  - Vite
  - TailwindCSS
  - React Router
  - Lucide Icons

- Backend:
  - Supabase (Authentication & Database)
  - Prisma ORM

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Git

### Installation

1. Clone the repository:
```bash
git clone https://github.com/itisaevalex/CleanCRM.git
cd CleanCRM
```

2. Install dependencies:
```bash
# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies
cd ../backend
npm install
```

3. Set up environment variables:
```bash
# Frontend (.env)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Backend (.env)
DATABASE_URL=your_database_url
```

4. Start the development server:
```bash
# Frontend
npm run dev

# Backend
npm run dev
```

## Project Structure

```
CleanCRM/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── CRMpages/
│   │   ├── lib/
│   │   └── App.tsx
│   └── package.json
├── backend/
│   ├── src/
│   ├── prisma/
│   └── package.json
└── README.md
```

## Contributing

This is a private repository. Please contact the repository owner for contribution guidelines.

## License

This project is private and confidential. All rights reserved.