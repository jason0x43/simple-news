import React, { createContext, useContext, useEffect, useState } from "react";
import { loadValue, storeValue } from "../util.ts";

export function createContextValue<T>(defaultValue: T | (() => T)) {
  const defaultVal = defaultValue instanceof Function
    ? defaultValue()
    : defaultValue;
  const ValueContext = createContext<T>(defaultVal);
  const SetterContext = createContext<React.Dispatch<React.SetStateAction<T>>>(
    () => undefined,
  );

  type ProviderProps = {
    initialState?: T;
  }

  const Provider: React.FC<ProviderProps> = ({ children, initialState }) => {
    const [value, setValue] = useState<T>(initialState ?? defaultValue);

    return (
      <SetterContext.Provider value={setValue}>
        <ValueContext.Provider value={value}>
          {children}
        </ValueContext.Provider>
      </SetterContext.Provider>
    );
  };

  const useValue = () => {
    return useContext(ValueContext);
  };

  const useSetter = () => {
    return useContext(SetterContext);
  };

  return {
    Provider,
    useValue,
    useSetter,
  };
}

function getRawCookie(key: string): string | undefined {
  if (!globalThis.document) {
    return;
  }

  const cookiesStr = globalThis.document.cookie;
  const cookies = cookiesStr.split(";").map((cookie) => cookie.trim());
  for (const cookie of cookies) {
    const [name, value] = cookie.split("=");
    if (name === key) {
      return value;
    }
  }
}

export function createPersistedContextValue<T>(
  key: string,
  defaultValue: T | (() => T),
  options?: {
    storageType: 'cookie' | 'localStore';
  }
) {
  const useCookie = options?.storageType === 'cookie';

  if (useCookie && defaultValue === undefined) {
    const cookie = getRawCookie(key);
    if (cookie !== undefined) {
      try {
        defaultValue = JSON.parse(cookie);
      } catch {
        // ignore
      }
    }
  }

  const context = createContextValue<T>(defaultValue);
  const {
    Provider: ContextProvider,
    useSetter: useContextSetter,
    useValue: useContextValue,
  } = context;

  const ValueInitializer: React.FC = ({ children }) => {
    const setContextValue = useContextSetter();

    useEffect(() => {
      const value = loadValue<T>(key);
      if (value !== undefined) {
        setContextValue(value);
      }
    }, []);

    return (
      <>
        {children}
      </>
    );
  };

  type ProviderProps = {
    initialState?: T;
  };

  const Provider: React.FC<ProviderProps> = ({ children, initialState }) => {
    let content: React.ReactNode;

    // We need to initialize the value in an effect so that the initial value
    // won't conflict with SSR
    if (initialState === undefined) {
      content = (
        <ValueInitializer>
          {children}
        </ValueInitializer>
      );
    } else {
      content = children;
    }

    return (
      <ContextProvider initialState={initialState}>
        {content}
      </ContextProvider>
    );
  };

  const useSetter = () => {
    const contextSetter = useContextSetter();
    const contextValue = useContextValue();
    return (
      valueOrSetter: T | ((oldArticle: T) => T),
    ) => {
      const value = valueOrSetter instanceof Function
        ? valueOrSetter(contextValue)
        : valueOrSetter;
      contextSetter(value);
      if (useCookie) {
        // Safari caps cookie length at 7 days
        const expires = new Date();
        expires.setDate(expires.getDate() + 7);
        document.cookie = `${key}=${
          value !== undefined ? JSON.stringify(value) : ""
        }; expires=${expires.toUTCString()}; samesite=strict`;
      } else {
        storeValue(key, value ?? null);
      }
    };
  };

  return {
    Provider,
    useValue: useContextValue,
    useSetter,
  };
}

export type Setter<T> = React.Dispatch<(prevValue: T) => T>;
