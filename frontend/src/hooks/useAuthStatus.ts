import { useQuery } from '@tanstack/react-query';

interface AuthStatusResponse {
    logged_in: boolean;
}

// The fetch function
export const checkAuthStatus = async (): Promise<AuthStatusResponse> => {
    const response = await fetch('http://127.0.0.1:5000/api/auth/status', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
    });

    if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to check authentication status');
    }

    return response.json();
}

// React Query hook for checking auth status
export const useAuthStatus = () => {
    return useQuery({
        queryKey: ['authStatus'],
        queryFn: checkAuthStatus,
        // Refresh every 5 minutes and when the window regains focus
        refetchInterval: 5 * 60 * 1000,
        refetchOnWindowFocus: true,
    });
}

