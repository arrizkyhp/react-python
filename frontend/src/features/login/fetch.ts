interface FetchLoginResponse {
    identifier: string;
    password: string;
    remember: boolean;
}

export const loginFetch = async (loginData: FetchLoginResponse) => {
    const response = await fetch('http://127.0.0.1:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData),
        credentials: "include",
    });
    if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to login');
    }
    return response.json();
}
