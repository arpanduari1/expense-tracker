# ExpenseWise AI Development Guide

## Architecture Overview

**ExpenseWise** is a React-TypeScript expense tracking application with a service-oriented architecture:

- **Frontend**: Vite + React 18 + TypeScript with React Router for SPA navigation
- **UI Framework**: shadcn/ui components built on Radix UI + Tailwind CSS with custom "Caffeine" theme
- **State Management**: TanStack Query for server state, React hooks for local state
- **Authentication**: JWT tokens with automatic refresh using Axios interceptors
- **Backend Integration**: RESTful API with comprehensive OpenAPI spec (`api-docs.json`)

## Critical Development Patterns

### Authentication Flow
- **Token Storage**: JWT access tokens in `localStorage.authToken`, refresh tokens in `localStorage.refreshToken`
- **Auto-refresh**: Implemented in `src/services/api.ts` with response interceptors handling 401s
- **Token Validation**: Use `src/utils/tokenUtils.ts` for expiration checks and payload parsing
- **Protected Routes**: Wrapped in `SidebarLayout` component for authenticated pages

### Service Layer Architecture
```typescript
// Pattern: All API calls go through service layer
// Location: src/services/*.ts
// Example: src/services/expenseService.ts
export const getExpenses = async (params: GetExpensesParams): Promise<PageExpenseResponse> => {
  const response = await api.get("/expenses", { params });
  return response.data;
};
```

### Type Safety
- **Strict TypeScript**: All API contracts defined in `src/types/index.ts`
- **Generic Pagination**: `PageResponse<T>` for all paginated endpoints
- **API Response Wrapper**: `ApiResponse<T>` for consistent error handling

### Component Patterns
- **Pages**: Feature-complete components in `src/pages/` (e.g., `Expenses.tsx` with full CRUD)
- **Layouts**: `SidebarLayout.tsx` provides authenticated shell with navigation
- **Forms**: React Hook Form + Zod validation (see existing expense forms)
- **State**: TanStack Query for server state, local useState for UI state

### UI/UX Standards
- **Theme System**: "Caffeine" theme with light/dark modes via `next-themes`
- **Color Variables**: CSS custom properties defined in `src/globals.css`
- **Icons**: Lucide React icons exclusively
- **Responsive**: Mobile-first with collapsible sidebar (`lg:` breakpoint)

## Development Workflows

### Local Development
```bash
pnpm dev          # Start dev server (port 5173)
pnpm build        # Production build
pnpm lint         # ESLint check
```

### API Integration
- **Base URL**: `VITE_API_BASE_URL` environment variable
- **Postman Collections**: Available in `Postman_API_Collection/` for testing
- **CORS**: Enabled with `withCredentials: true` in Axios config

### Styling Approach
1. Use shadcn/ui components as foundation
2. Apply Tailwind classes for custom styling
3. Leverage CSS variables for theme consistency
4. Follow mobile-first responsive design

## Project-Specific Conventions

### File Organization
```
src/
├── pages/           # Route components (full features)
├── components/      # Reusable UI components
│   └── ui/         # shadcn/ui components (don't edit)
├── services/        # API integration layer
├── layouts/         # Page layout wrappers
├── hooks/          # Custom React hooks
├── utils/          # Pure utility functions
└── types/          # TypeScript type definitions
```

### Error Handling
- **Toast Notifications**: Use `src/utils/toast.ts` for user feedback
- **API Errors**: Handled globally in Axios interceptors
- **Loading States**: TanStack Query provides `isLoading`, `error` states

### State Management Philosophy
- **Server State**: TanStack Query with query keys like `['expenses', filters]`
- **Local State**: React useState/useReducer for component state
- **Global State**: Minimal - auth tokens in localStorage, theme in next-themes

### Navigation
- **Route Structure**: Defined in `src/App.tsx` with public/protected route separation
- **Sidebar Navigation**: Configured in `src/layouts/SidebarLayout.tsx`
- **Programmatic Navigation**: Use React Router's `useNavigate()` hook

## Key Integration Points

### Currency Handling
- User currency stored in localStorage and user profile
- Display formatting using user's selected currency throughout app

### Real-time Features
- **Optimistic Updates**: TanStack Query mutations with immediate UI updates
- **Cache Invalidation**: Strategic query invalidation after mutations

### External Dependencies
- **Date Handling**: `date-fns` for formatting and manipulation
- **Charts**: Recharts for analytics visualization
- **Form Validation**: React Hook Form + Zod schemas

When implementing new features, follow these established patterns for consistency with the existing codebase. Always use the service layer for API calls, maintain type safety, and leverage the shadcn/ui component system.
