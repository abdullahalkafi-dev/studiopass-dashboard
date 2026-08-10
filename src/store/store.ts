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
import authReducer, { logout } from "@/features/auth/authSlice";
import { baseApi } from "@/features/api/baseApi";
import { authApi } from "@/features/auth/authApi";
import { countryApi } from "@/features/country/countryApi";
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
import { notificationApi } from "@/features/notification/notificationApi";
import { statusApi } from "@/features/status/statusApi";
import { challengeApi } from "@/features/challenge/challengeApi";
import { channelPollApi } from "@/features/channelPoll/channelPollApi";
import { prizeTypeApi } from "@/features/prizeType/prizeTypeApi";
import { disbursementApi } from "@/features/disbursement/disbursementApi";

const appReducer = combineReducers({
  auth: authReducer,
  [baseApi.reducerPath]: baseApi.reducer,
  [authApi.reducerPath]: authApi.reducer,
  [countryApi.reducerPath]: countryApi.reducer,
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
  [notificationApi.reducerPath]: notificationApi.reducer,
  [statusApi.reducerPath]: statusApi.reducer,
  [challengeApi.reducerPath]: challengeApi.reducer,
  [channelPollApi.reducerPath]: channelPollApi.reducer,
  [prizeTypeApi.reducerPath]: prizeTypeApi.reducer,
  [disbursementApi.reducerPath]: disbursementApi.reducer,
});

const rootReducer = (state: ReturnType<typeof appReducer> | undefined, action: any) => {
  if (action.type === logout.type || action.type === "auth/logout") {
    state = undefined;
  }
  return appReducer(state, action);
};

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
        .concat(baseApi.middleware)
        .concat(authApi.middleware)
        .concat(countryApi.middleware)
        .concat(showApi.middleware)
        .concat(messageApi.middleware)
        .concat(creditApi.middleware)
        .concat(crmApi.middleware)
        .concat(statementApi.middleware)
        .concat(pollApi.middleware)
        .concat(templateApi.middleware)
        .concat(dashboardApi.middleware)
        .concat(stationApiKeyApi.middleware)
        .concat(callApi.middleware)
        .concat(notificationApi.middleware)
        .concat(statusApi.middleware)
        .concat(challengeApi.middleware)
        .concat(channelPollApi.middleware)
        .concat(prizeTypeApi.middleware)
        .concat(disbursementApi.middleware),
  });

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
