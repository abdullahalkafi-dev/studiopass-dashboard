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
import { presenterApi } from "@/features/presenter/presenterApi";
import { showApi } from "@/features/show/showApi";
import { messageApi } from "@/features/message/messageApi";
import { creditApi } from "@/features/credit/creditApi";
import { crmApi } from "@/features/crm/crmApi";
import { statementApi } from "@/features/statement/statementApi";
import { pollApi } from "@/features/poll/pollApi";
import { templateApi } from "@/features/template/templateApi";
import { dashboardApi } from "@/features/dashboard/dashboardApi";
import { stationApiKeyApi } from "@/features/station-api/stationApiKeyApi";
import { callApi } from "@/features/call/callApi";

const rootReducer = combineReducers({
  auth: authReducer,
  [authApi.reducerPath]: authApi.reducer,
  [partnerApi.reducerPath]: partnerApi.reducer,
  [countryApi.reducerPath]: countryApi.reducer,
  [stationApi.reducerPath]: stationApi.reducer,
  [userApi.reducerPath]: userApi.reducer,
  [mediaStationApi.reducerPath]: mediaStationApi.reducer,
  [presenterApi.reducerPath]: presenterApi.reducer,
  [showApi.reducerPath]: showApi.reducer,
  [messageApi.reducerPath]: messageApi.reducer,
  [creditApi.reducerPath]: creditApi.reducer,
  [crmApi.reducerPath]: crmApi.reducer,
  [statementApi.reducerPath]: statementApi.reducer,
  [pollApi.reducerPath]: pollApi.reducer,
  [templateApi.reducerPath]: templateApi.reducer,
  [dashboardApi.reducerPath]: dashboardApi.reducer,
  [stationApiKeyApi.reducerPath]: stationApiKeyApi.reducer,
  [callApi.reducerPath]: callApi.reducer,
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
        .concat(mediaStationApi.middleware)
        .concat(presenterApi.middleware)
        .concat(showApi.middleware)
        .concat(messageApi.middleware)
        .concat(creditApi.middleware)
        .concat(crmApi.middleware)
        .concat(statementApi.middleware)
        .concat(pollApi.middleware)
        .concat(templateApi.middleware)
        .concat(dashboardApi.middleware)
        .concat(stationApiKeyApi.middleware)
        .concat(callApi.middleware),
  });

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
