# Expenses Tracker Frontend

This is the frontend application for the Expenses Tracker, built with React, Vite, and TailwindCSS.

## Technologies Used

- **Framework:** [React](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Styling:** [TailwindCSS v4](https://tailwindcss.com/)
- **State Management:** [Zustand](https://github.com/pmndrs/zustand)
- **Forms:** [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/)
- **Routing:** [React Router DOM](https://reactrouter.com/)
- **Utility:** [Lucide React](https://lucide.dev/), [Radix UI](https://www.radix-ui.com/)

## Prerequisites

- Node.js (Latest LTS recommended)
- [pnpm](https://pnpm.io/) (Package manager)

## Installation

1. Navigate to the project directory:
   ```bash
   cd Front
   ```
2. Install dependencies:
   ```bash
   pnpm install
   ```

## Environment Variables

Create a `.env` file in the root of the `Front` directory with the following variables:

```env
VITE_PUBLIC_URL=/
VITE_SESSION_ACTIVE_MINUTES=55
VITE_SESSION_REFRESH_MINUTES=59
VITE_API_URL=http://localhost:5236/
```

## Scripts

- **Development Server:**
  ```bash
  pnpm dev
  ```
  Runs the app in development mode.

- **Build:**
  ```bash
  pnpm build
  ```
  Builds the app for production to the `dist` folder.

- **Lint:**
  ```bash
  pnpm lint
  ```
  Runs ESLint to check for code quality issues.

- **Preview:**
  ```bash
  pnpm preview
  ```
  Locally preview the production build.

## Project Structure

- `src/`: Source code
  - `components/`: Reusable UI components
  - `pages/`: Application pages/routes
  - `hooks/`: Custom React hooks
  - `store/`: Zustand stores for state management
  - `utils/`: Helper functions
