"use client";

import { useEffect, useRef } from "react";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { persistStore } from "redux-persist";
import { setupListeners } from "@reduxjs/toolkit/query";
import { makeStore, type AppStore } from "./store";
import { syncFromStorage } from "@/features/auth/authSlice";
import { PageSkeleton } from "@/components/ui/skeleton";

/** redux-persist keeps the whole persisted state under this single localStorage key. */
const PERSIST_KEY = "persist:root";

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const storeRef = useRef<AppStore>(null);
  const persistorRef = useRef<any>(null);

  if (!storeRef.current) {
    storeRef.current = makeStore();
    persistorRef.current = persistStore(storeRef.current);
  }

  // Lets RTK Query refetch when the browser comes back online (queries opt in with refetchOnReconnect)
  useEffect(() => {
    if (!storeRef.current) return;
    return setupListeners(storeRef.current.dispatch);
  }, []);

  // Several tabs share one saved session. When one tab refreshes the tokens (or signs out), the others adopt
  // the result instead of carrying on with a refresh token that was just replaced: that is what used to sign
  // the second tab out.
  useEffect(() => {
    const store = storeRef.current;
    if (!store) return;

    const onStorage = (event: StorageEvent) => {
      if (event.key !== PERSIST_KEY || !event.newValue) return;
      try {
        // Every top-level key is stored as its own JSON string inside the persisted JSON object
        const persisted = JSON.parse(event.newValue);
        const auth = typeof persisted.auth === "string" ? JSON.parse(persisted.auth) : null;
        store.dispatch(syncFromStorage(auth));
      } catch {
        // unreadable value: ignore, this tab keeps its own session
      }
    };

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return (
    <Provider store={storeRef.current}>
      <PersistGate
        loading={
          <div className="mx-auto max-w-6xl p-6">
            <PageSkeleton />
          </div>
        }
        persistor={persistorRef.current}
      >
        {children}
      </PersistGate>
    </Provider>
  );
}
