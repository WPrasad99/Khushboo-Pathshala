import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App.jsx'

// Global unhandled rejection handler - prevents silent failures
window.addEventListener('unhandledrejection', (event) => {
    if (event.reason?.message?.includes('AbortError')) return; // Ignore intentional aborts
    console.error('[Unhandled Rejection]', event.reason);
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

createRoot(document.getElementById('root')).render(
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>
)
