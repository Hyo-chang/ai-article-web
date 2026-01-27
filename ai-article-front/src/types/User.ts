// src/types/User.ts
export interface User {
    userId?: number;
    username: string;
    email?: string;
    token: string;
    roles?: string[];
}