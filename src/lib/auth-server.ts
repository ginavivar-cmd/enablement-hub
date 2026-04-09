import { cookies } from "next/headers";
import { USERS } from "./constants";

const SESSION_COOKIE = "enablement-hub-session";

export async function getSession(): Promise<{
  name: string;
  displayName: string;
} | null> {
  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE);
  if (!session) return null;

  try {
    return JSON.parse(session.value);
  } catch {
    return null;
  }
}

export function validateLogin(password: string): {
  name: string;
  displayName: string;
} | null {
  const normalized = password.trim().toLowerCase();
  const user = USERS.find(
    (u) => u.key === normalized || u.name.toLowerCase() === normalized
  );
  if (!user) return null;
  return { name: user.name, displayName: user.displayName };
}

export { SESSION_COOKIE };
