export type UserRole = 'user' | 'facilitator' | 'admin';

export function isUser(role?: string) {
  return role === 'user';
}

export function isFacilitator(role?: string) {
  return role === 'facilitator';
}

export function isAdmin(role?: string) {
  return role === 'admin';
}

export function hasRole(role: string | undefined, allowed: UserRole[]) {
  return !!role && allowed.includes(role as UserRole);
} 