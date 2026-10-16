import { createAuthClient } from 'better-auth/react';
import { usernameClient } from 'better-auth/client/plugins';

const getBaseURL = () => {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return 'http://localhost:8787';
};

export const authClient = createAuthClient({
  baseURL: getBaseURL(),
  plugins: [usernameClient()],
});

export const { useSession, signIn, signUp, signOut, getSession } = authClient;
