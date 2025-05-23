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
import {RedirectIfAuthenticated} from "@/components/layouts/ProtectedRoute";
import RolePage from "@/pages/Role/RolePage.tsx";
import RoleDetailPage from "@/pages/Role/RoleDetail.tsx";
import RoleCreatePage from "@/pages/Role/RoleCreate.tsx";

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
            {
                path: "Role", // The URL path for the about page
                children: [
                    {
                        index: true,
                        element: <RolePage />,
                    },
                    {
                        path: "create",
                        element: <RoleCreatePage />,
                    },
                    {
                        path: ":id",
                        element: <RoleDetailPage />,
                    },
                    {
                        path: ":id/edit",
                        element: <RoleDetailPage />,
                    },
                ]
            },
            {
                path: "Contact", // The URL path for the about page
                element: <ContactPage />,
            },
            // Add more routes here for other pages
        ]
    },
    {
        path: '/',
        element: <RedirectIfAuthenticated />,
        children: [
            {
                path: '/login',
                element: <LoginPage />,
            },
            // Add more public routes here that should redirect if logged in
        ],
    },
]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
      <QueryClientProvider client={queryClient} >
            <RouterProvider router={router} />
            <Toaster />
    </QueryClientProvider>
  </StrictMode>,
)
