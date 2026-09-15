import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

interface AuthUser {
  id: string;
  fullName?: string;
  avatar?: string;
  phone?: string;
  email?: string;
  role: string;
  partnerId?: string;
  stationId?: string;
  stationName?: string;
  stationLogo?: string;
  station?: any;
  stationCategory?: string;
  channelType?: string;
  timezone?: string;
  twoFactorEnabled?: boolean;
  sessionId?: string;
  deviceId?: string;
  isApprovedStudioDevice?: boolean;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  refreshToken: string | null;
  sessionId: string | null;
  deviceId: string | null;
  isApprovedStudioDevice: boolean;
  isAuthenticated: boolean;
}

const initialState: AuthState = {
  user: null,
  token: null,
  refreshToken: null,
  sessionId: null,
  deviceId: null,
  isApprovedStudioDevice: false,
  isAuthenticated: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{
        user: AuthUser;
        accessToken: string;
        refreshToken: string;
      }>
    ) => {
      state.user = action.payload.user;
      state.token = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      state.sessionId = action.payload.user?.sessionId || null;
      state.deviceId = action.payload.user?.deviceId || null;
      state.isApprovedStudioDevice = Boolean(action.payload.user?.isApprovedStudioDevice);
      state.isAuthenticated = true;
    },
    updateToken: (state, action: PayloadAction<string>) => {
      state.token = action.payload;
    },
    updateUser: (state, action: PayloadAction<Partial<AuthUser>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
        if (action.payload.sessionId !== undefined) state.sessionId = action.payload.sessionId || null;
        if (action.payload.deviceId !== undefined) state.deviceId = action.payload.deviceId || null;
        if (action.payload.isApprovedStudioDevice !== undefined) state.isApprovedStudioDevice = Boolean(action.payload.isApprovedStudioDevice);
      }
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.sessionId = null;
      state.deviceId = null;
      state.isApprovedStudioDevice = false;
      state.isAuthenticated = false;
    },
  },
});

export const { setCredentials, updateToken, updateUser, logout } = authSlice.actions;
export default authSlice.reducer;
