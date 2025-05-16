import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import {Toaster} from "sonner";
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {createBrowserRouter, RouterProvider} from "react-router-dom";
import UserPage from "@/pages/User/UserPage.tsx";
import ContactPage from "@/pages/Contact/ContactPage.tsx";
import LayoutWithSidebar from "@/components/layouts/LayoutWithSidebar";
import LoginPage from "@/pages/Login/LoginPage.tsx";

const queryClient = new QueryClient();
const router = createBrowserRouter([
    {
        element: <LayoutWithSidebar />,
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
    {
        // This is a separate top-level route for the Login page.
        // It does not use LayoutWithSidebar, so SidebarProvider will not be applied.
        path: "Login",
        // You should ideally use a dedicated LoginPage component here
        // For now, using UserPage as per your original setup for /Login
        element: <LoginPage />,
        // element: <LoginPage />, // Example if you have a LoginPage
    }
]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
      <QueryClientProvider client={queryClient} >
            <RouterProvider router={router} />
            <Toaster />
    </QueryClientProvider>
  </StrictMode>,
)
