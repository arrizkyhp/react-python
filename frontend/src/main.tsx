import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import {Toaster} from "sonner";
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {createBrowserRouter, RouterProvider} from "react-router-dom";
import { SidebarProvider } from './components/ui/sidebar.tsx';
import UserPage from "@/pages/User/UserPage.tsx";
import ContactPage from "@/pages/Contact/ContactPage.tsx";

const queryClient = new QueryClient();
const router = createBrowserRouter([
    {
        path: "/",
        element: <App />,
        // errorElement: <ErrorPage />, // Optional error page
        children: [
            {
                index: true,
                element: <ContactPage />,
            },
            {
                path: "User", // The URL path for the about page
                element: <UserPage />,
            },
            // Add more routes here for other pages
        ]
    },
]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
      <QueryClientProvider client={queryClient} >
          <SidebarProvider>
            <RouterProvider router={router} />
            <Toaster />
          </SidebarProvider>
    </QueryClientProvider>
  </StrictMode>,
)
