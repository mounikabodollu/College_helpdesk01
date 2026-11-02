const BASE_URL=`${import.meta.env.VITE_API_BASE_URL || "https://localhost:5000"}/api`;

async function request(endpoint, options = {}) {
    const url = `${BASE_URL}${endpoint}`;
    const config = {
        headers: { "Content-Type": "application/json" },
        ...options,
    };
    const response = await fetch(url, config);
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.error || "Request failed");
    }
    return data;
}