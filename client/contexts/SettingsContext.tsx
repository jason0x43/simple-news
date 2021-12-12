import { React, useContext, useMemo } from "../deps.ts";

export interface Settings {
  articleFilter: "unread" | "all" | "saved";
}

const SettingsContext = React.createContext<
  { settings: Settings; updateSettings: (val: Partial<Settings>) => void }
>({ settings: { articleFilter: "unread" }, updateSettings: () => undefined });

export default SettingsContext;

export interface SettingsProviderProps {
  settings?: Settings;
}

export const SettingsProvider: React.FC<SettingsProviderProps> = (props) => {
  const [settings, setSettings] = React.useState<Settings>(
    props.settings ?? { articleFilter: "unread" },
  );

  const value = useMemo(() => ({
    settings,

    updateSettings: (newSettings: Partial<Settings>) => {
      setSettings({
        ...settings,
        ...newSettings,
      });
    },
  }), [settings]);

  return (
    <SettingsContext.Provider value={value}>
      {props.children}
    </SettingsContext.Provider>
  );
};

export function useSettings() {
  return useContext(SettingsContext);
}
