import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: "admin" | "editor" | "viewer";
  avatarUrl?: string;
  isEmailVerified: boolean;
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  status: "idle" | "loading" | "authenticated" | "unauthenticated";
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  status: "idle",
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials(state, action: PayloadAction<{ user: AuthUser; accessToken: string }>) {
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.status = "authenticated";
    },
    setAccessToken(state, action: PayloadAction<string>) {
      state.accessToken = action.payload;
      state.status = "authenticated";
    },
    setStatus(state, action: PayloadAction<AuthState["status"]>) {
      state.status = action.payload;
    },
    logout(state) {
      state.user = null;
      state.accessToken = null;
      state.status = "unauthenticated";
    },
  },
});

export const { setCredentials, setAccessToken, setStatus, logout } = authSlice.actions;
export default authSlice.reducer;
