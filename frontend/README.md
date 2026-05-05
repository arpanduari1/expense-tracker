# ExpenseWise 💰

A modern, full-featured expense tracking application built with React, TypeScript, and TailwindCSS. Manage your finances with style using our custom "Caffeine" theme and intuitive interface.


## ✨ Features

- **💸 Expense Management**: Track, categorize, and manage your daily expenses
- **📊 Analytics & Reports**: Visualize your spending patterns with interactive charts
- **💰 Budget Planning**: Set and monitor monthly/yearly budgets
- **📅 Calendar View**: View expenses in an organized calendar interface
- **👤 User Profiles**: Personalized experience with customizable settings
- **🎨 Theme Support**: Light/Dark mode with custom "Caffeine" theme
- **📱 Responsive Design**: Mobile-first approach for all devices
- **🔐 Secure Authentication**: JWT-based authentication with auto-refresh
- **💱 Multi-Currency**: Support for multiple currencies
- **📤 Export Data**: Export your financial data in various formats

## 🚀 Quick Start

### Prerequisites

Before you begin, ensure you have the following installed on your machine:

- **Node.js** (v18.0.0 or higher) - [Download here](https://nodejs.org/)
- **pnpm** (v8.0.0 or higher) - [Install pnpm](https://pnpm.io/installation)
- **Git** - [Download here](https://git-scm.com/)

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/tusar-003/ExpenseWise.git
   cd ExpenseWise
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Environment Configuration**
   
   Copy the example environment file and configure your variables:

   ```bash
   cp .env.example .env
   ```

   Or create a `.env` file manually with the following variables:

   ```bash
   # API Configuration
   VITE_API_BASE_URL=https://expense-tracker-1p6d.onrender.com/api/v1/
   VITE_APP_PORT=3001
   ```

   **Environment Variables Explained:**
   - `VITE_API_BASE_URL`: Backend API endpoint URL
   - `VITE_APP_PORT`: Port for the development server (optional)

4. **Start the development server**

   ```bash
   pnpm dev
   ```

5. **Open your browser**
   
   Navigate to `http://localhost:3001` to see the application running.

### Alternative Installation Methods

#### Using npm

```bash
npm install
npm run dev
```

#### Using yarn

```bash
yarn install
yarn dev
```

## 🛠️ Development Setup

### Project Structure

```text
ExpenseWise/
├── src/
│   ├── components/          # Reusable UI components
│   │   └── ui/             # shadcn/ui components
│   ├── pages/              # Route components
│   ├── services/           # API integration layer
│   ├── layouts/            # Page layout wrappers
│   ├── hooks/              # Custom React hooks
│   ├── utils/              # Utility functions
│   └── types/              # TypeScript definitions
├── public/                 # Static assets
├── Postman_API_Collection/ # API testing collections
└── Fixex/                  # Documentation and guides
```

### Available Scripts

- **`pnpm dev`** - Start development server (port 3001)
- **`pnpm build`** - Build for production
- **`pnpm build:dev`** - Build for development
- **`pnpm lint`** - Run ESLint checks
- **`pnpm preview`** - Preview production build

### Development Workflow

1. **Feature Development**
   - Create feature branches from `main`
   - Follow the established component patterns
   - Use TypeScript for type safety
   - Implement responsive design with Tailwind CSS

2. **API Integration**
   - All API calls go through the service layer (`src/services/`)
   - Use TanStack Query for server state management
   - Follow the authentication patterns for protected routes

3. **Testing**
   - Use Postman collections in `Postman_API_Collection/` for API testing
   - Test responsive design across different screen sizes
   - Verify authentication flows

## 🎨 Tech Stack

### Frontend

- **React 18** - Modern React with hooks and concurrent features
- **TypeScript** - Static type checking
- **Vite** - Fast build tool and dev server
- **TailwindCSS** - Utility-first CSS framework
- **shadcn/ui** - High-quality UI components built on Radix UI

### State Management

- **TanStack Query** - Server state management and caching
- **React Hook Form** - Form state management
- **Zustand** (if applicable) - Client state management

### Routing & Navigation

- **React Router v6** - Client-side routing
- **Protected Routes** - Authentication-based route protection

### UI & Styling

- **Radix UI** - Unstyled, accessible UI primitives
- **Lucide React** - Icon library
- **next-themes** - Theme management
- **Tailwind Animate** - CSS animations

### Development Tools

- **ESLint** - Code linting
- **Prettier** (if configured) - Code formatting
- **PostCSS** - CSS processing

## 🔧 Configuration

### Theme Customization

The application uses a custom "Caffeine" theme. You can customize colors and styles in:

- `src/globals.css` - CSS custom properties
- `tailwind.config.ts` - Tailwind configuration
- `components.json` - shadcn/ui configuration

### API Configuration

The app connects to a backend API. Configuration is handled through environment variables:

- Backend URL is configurable via `VITE_API_BASE_URL`
- Authentication uses JWT tokens with automatic refresh
- CORS is configured with `withCredentials: true`

## 📱 Features Guide

### Authentication

- **Login/Signup**: JWT-based authentication
- **Password Reset**: Email-based password recovery
- **Auto-refresh**: Automatic token refresh for seamless experience

### Expense Management

- **Add Expenses**: Quick expense entry with categorization
- **Edit/Delete**: Full CRUD operations
- **Categories**: Custom expense categories
- **Search & Filter**: Find expenses quickly

### Budget Planning

- **Set Budgets**: Monthly and yearly budget planning
- **Track Progress**: Visual progress indicators
- **Budget Alerts**: Notifications when approaching limits

### Analytics

- **Spending Trends**: Visual charts and graphs
- **Category Breakdown**: Spending by category analysis
- **Time-based Reports**: Monthly, yearly financial reports

## 🚀 Deployment

### Build for Production

```bash
pnpm build
```

### Deploy to Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Configure environment variables in Vercel dashboard
4. Deploy automatically on every push to main

### Deploy to Netlify

1. Build the project: `pnpm build`
2. Upload the `dist` folder to Netlify
3. Configure environment variables
4. Set up continuous deployment

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit your changes**: `git commit -m 'Add amazing feature'`
4. **Push to the branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**

### Development Guidelines

- Follow the existing code style and patterns
- Use TypeScript for all new code
- Implement responsive design
- Add appropriate error handling
- Test your changes thoroughly

## 🐛 Troubleshooting

### Common Issues

#### Port already in use

```bash
Error: Port 3001 is already in use
```

Solution: Change the port in `vite.config.ts` or kill the process using the port.

#### Dependencies installation fails

```bash
pnpm install fails
```

Solutions:

- Clear node_modules: `rm -rf node_modules pnpm-lock.yaml`
- Reinstall: `pnpm install`
- Check Node.js version (requires v18+)

#### API connection issues

- Verify `VITE_API_BASE_URL` in `.env` file
- Check if the backend server is running
- Verify CORS configuration

#### Build fails

- Run `pnpm lint` to check for code issues
- Ensure all TypeScript errors are resolved
- Check for missing dependencies

## 📞 Support

If you encounter any issues or have questions:

1. **Check the documentation** in the `Fixex/` folder
2. **Search existing issues** on GitHub
3. **Create a new issue** with detailed information
4. **Join our community** discussions

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [shadcn/ui](https://ui.shadcn.com/) for the amazing UI components
- [Radix UI](https://www.radix-ui.com/) for accessible primitives
- [TailwindCSS](https://tailwindcss.com/) for the utility-first CSS framework
- [Vite](https://vitejs.dev/) for the lightning-fast build tool

---

Built with ❤️ by the ExpenseWise team

Happy expense tracking! 💰
