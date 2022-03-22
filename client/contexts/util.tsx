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

  const Provider: React.FC = ({ children }) => {
    const [value, setValue] = useState<T>(defaultValue);

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

export function createPersistedContextValue<T>(
  key: string,
  defaultValue: T | (() => T),
) {
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

  const Provider: React.FC = ({ children }) => {
    return (
      <ContextProvider>
        <ValueInitializer>
          {children}
        </ValueInitializer>
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
