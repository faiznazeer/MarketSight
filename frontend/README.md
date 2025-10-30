# MarketSight AI

MarketSight AI is a modern, professional AI-powered financial research assistant that helps users analyze public companies through an intelligent chat interface powered by RAG (Retrieval-Augmented Generation) technology.

## Features

### 🔐 Authentication
- Clean, centered login and sign-up pages
- OAuth integration (Google)
- Email/password authentication
- Persistent user sessions

### 💬 Research Sessions
- Create dedicated chat sessions for specific stocks/topics
- Each session maintains its own chat history
- Editable session titles
- Stock ticker association
- Session management (rename, delete)

### 🤖 AI-Powered Chat Interface
- Real-time streaming responses
- Markdown rendering with support for:
  - Tables
  - Code blocks
  - Headers, lists, bold/italic text
  - Links
- Source citations with expandable details
- Copy message functionality
- Example prompts to get started

### 📊 Source Citations
- View original document snippets
- Page references
- Document type indicators
- Expandable source cards

### 🎨 Design
- **Dark mode by default** with professional financial/tech aesthetic
- **Responsive design** - works seamlessly on desktop, tablet, and mobile
- **Three-panel layout**:
  - Left sidebar: Session navigation
  - Center panel: Chat interface
  - Header: Logo and user profile
- Smooth animations and transitions
- Custom scrollbars
- Hover states and interactive elements

### 📱 Responsive Features
- Mobile-optimized layout
- Collapsible sidebar with hamburger menu
- Touch-friendly interface
- Adaptive typography

## Tech Stack

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS v4** - Styling
- **React Router** - Navigation
- **Lucide React** - Icons
- **React Markdown** - Markdown rendering
- **Custom Shadcn/UI components** - UI primitives

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser and navigate to the URL shown in the terminal (typically `http://localhost:5173`)

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Project Structure

```
frontend/
├── src/
│   ├── components/        # Reusable UI components
│   │   ├── ui/           # Base UI components (Button, Input, etc.)
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   ├── ChatWindow.tsx
│   │   ├── ChatMessage.tsx
│   │   └── LoadingSpinner.tsx
│   ├── context/          # React context for state management
│   │   └── AppContext.tsx
│   ├── pages/            # Page components
│   │   ├── Login.tsx
│   │   ├── SignUp.tsx
│   │   └── MainApp.tsx
│   ├── types/            # TypeScript type definitions
│   │   └── index.ts
│   ├── lib/              # Utility functions
│   │   └── utils.ts
│   ├── App.tsx           # Main app component with routing
│   ├── main.tsx          # Application entry point
│   └── index.css         # Global styles and theme
├── public/               # Static assets
├── index.html           # HTML template
└── package.json         # Dependencies and scripts
```

## Usage

### Authentication
1. Visit the login page at `/login`
2. Either:
   - Sign in with Google OAuth
   - Enter email and password credentials
3. Or create a new account at `/signup`

### Creating a Research Session
1. Click the "+ New Chat" button in the sidebar
2. Enter a session title (e.g., "Deep Dive on AAPL Q4")
3. Enter a stock ticker (e.g., "AAPL")
4. Click "Create"

### Asking Questions
1. Select a research session from the sidebar
2. Type your question in the input field at the bottom
3. Press Enter to send (Shift+Enter for new line)
4. Watch as the AI streams its response in real-time
5. Click "View Sources" to see the original document citations

### Managing Sessions
- **Rename**: Hover over a session and click the "..." menu, then "Rename"
- **Delete**: Hover over a session and click the "..." menu, then "Delete"
- **Switch sessions**: Click on any session in the sidebar

## Mock Data

The current version uses mock data for demonstration purposes:
- Authentication is simulated (accepts any credentials)
- AI responses are pre-defined with simulated streaming
- Sources are mock citations from fictional 10-K reports

**To connect to a real backend:**
1. Update the authentication logic in `Login.tsx` and `SignUp.tsx`
2. Implement API calls in `ChatWindow.tsx` to replace the mock streaming function
3. Connect to your RAG backend service

## Customization

### Theme Colors
Edit `src/index.css` to customize the color scheme:
```css
@theme {
  --color-primary: 217.2 91.2% 59.8%;
  --color-secondary: 217.2 32.6% 17.5%;
  /* ... other colors */
}
```

### Fonts
Change the font in `index.html` and `src/index.css`

### Example Prompts
Edit the `EXAMPLE_PROMPTS` array in `src/components/ChatWindow.tsx`

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

## License

This project is private and proprietary.

## Contributing

This is a private project. For questions or contributions, contact the development team.
