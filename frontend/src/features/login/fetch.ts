import api from '@/lib/axios.ts';

interface FetchLoginResponse {
    identifier: string;
    password: string;
    remember: boolean;
}

interface LoginSuccessResponse {
    message: string;
    user: {
        id: number;
        username: string;
        email: string;
    };
}

export const login = async (loginData: FetchLoginResponse): Promise<LoginSuccessResponse> => {
    const response = await api.post<LoginSuccessResponse>('/auth/login', loginData); // Full path after base
    return response.data;
};

export const logout = async (): Promise<void> => {
    await api.post('/auth/logout');
};
