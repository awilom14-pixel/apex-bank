export interface User {
  userId: string;
  email: string;
  name: string;
  isAdmin: boolean;
  balance: number;
}

export async function fetchSession(): Promise<User | null> {
  try {
    const res = await fetch("/api/auth/session");
    if (!res.ok) return null;
    const data = await res.json();
    return data.user || null;
  } catch {
    return null;
  }
}

export async function logout(): Promise<void> {
  await fetch("/api/auth/register", { method: "DELETE" });
  localStorage.removeItem("apex-user");
  window.location.href = "/login";
}
