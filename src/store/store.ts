import { configureStore, combineReducers } from "@reduxjs/toolkit";
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from "redux-persist";
import storage from "redux-persist/lib/storage";
import authReducer from "@/features/auth/authSlice";
import { authApi } from "@/features/auth/authApi";
import { partnerApi } from "@/features/partner/partnerApi";
import { countryApi } from "@/features/country/countryApi";
import { stationApi } from "@/features/station/stationApi";
import { userApi } from "@/features/user/userApi";
import { mediaStationApi } from "@/features/media-station/mediaStationApi";

const rootReducer = combineReducers({
  auth: authReducer,
  [authApi.reducerPath]: authApi.reducer,
  [partnerApi.reducerPath]: partnerApi.reducer,
  [countryApi.reducerPath]: countryApi.reducer,
  [stationApi.reducerPath]: stationApi.reducer,
  [userApi.reducerPath]: userApi.reducer,
  [mediaStationApi.reducerPath]: mediaStationApi.reducer,
});

const persistConfig = {
  key: "root",
  storage,
  whitelist: ["auth"],
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const makeStore = () =>
  configureStore({
    reducer: persistedReducer,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: {
          ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
        },
      })
        .concat(authApi.middleware)
        .concat(partnerApi.middleware)
        .concat(countryApi.middleware)
        .concat(stationApi.middleware)
        .concat(userApi.middleware)
        .concat(mediaStationApi.middleware),
  });

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
