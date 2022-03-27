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
  };

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

/**
 * A context value that's persisted in a cookie
 *
 * This value doesn't self-restore when initialized. Any initialization will be
 * handled by the server passing a cookie value back as initial state.
 */
export function createCookieContextValue<T>(
  key: string,
  defaultValue: T | (() => T),
) {
  const context = createContextValue<T>(defaultValue);
  const {
    Provider: ContextProvider,
    useSetter: useContextSetter,
    useValue: useContextValue,
  } = context;

  type ProviderProps = {
    initialState?: T;
  };

  const Provider: React.FC<ProviderProps> = ({ children, initialState }) => {
    return (
      <ContextProvider initialState={initialState}>
        {children}
      </ContextProvider>
    );
  };

  /**
   * Wrap the default setter to persist the value
   */
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

      // Safari caps cookie length at 7 days
      const expires = new Date();
      expires.setDate(expires.getDate() + 7);
      document.cookie = `${key}=${
        value !== undefined ? JSON.stringify(value) : ""
      }; expires=${expires.toUTCString()}; samesite=strict`;
    };
  };

  return {
    Provider,
    useValue: useContextValue,
    useSetter,
  };
}

/**
 * A context value that's persisted in local storage
 */
export function createLocalStorageContextValue<T>(
  key: string,
  defaultValue: T | (() => T),
) {
  const context = createContextValue<T>(defaultValue);
  const {
    Provider: ContextProvider,
    useSetter: useContextSetter,
    useValue: useContextValue,
  } = context;

  type ProviderProps = {
    initialState?: T;
  };

  const Provider: React.FC<ProviderProps> = ({ children, initialState }) => {
    const setContextValue = useContextSetter();

    // If we're loading a value from local storage, we need to do it in effect
    // so the client won't initially disagree with whatever the server rendered
    useEffect(() => {
      const value = loadValue<T>(key);
      if (value !== undefined) {
        setContextValue(value);
      }
    }, []);

    return (
      <ContextProvider initialState={initialState}>
        {children}
      </ContextProvider>
    );
  };

  /**
   * Wrap the default setter to persist the value
   */
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
      storeValue(key, value ?? null);
    };
  };

  return {
    Provider,
    useValue: useContextValue,
    useSetter,
  };
}

export type Setter<T> = React.Dispatch<(prevValue: T) => T>;
