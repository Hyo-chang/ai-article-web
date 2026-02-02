// src/types/User.ts
export interface User {
    userId?: number;
    username: string;
    email?: string;
    token: string;
    roles?: string[];
    profileImageUrl?: string | null;
    nickname?: string;  // username을 닉네임으로 사용하지만 별도 필드도 지원
}