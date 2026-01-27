import { HiveAccount } from "@/hooks/useHiveAccount";
import useHiveAccount from "@/hooks/useHiveAccount";
import useUserbaseHiveIdentity from "@/hooks/useUserbaseHiveIdentity";
import { createContext, useContext, useEffect, useState } from "react";

export interface HiveUserContextProps {
  hiveUser: HiveAccount | null;
  setHiveUser: (user: HiveAccount | null) => void;
  isLoading: boolean | undefined;
  refreshUser: () => void;
}

const HiveUserContext = createContext<HiveUserContextProps | undefined>(
  undefined,
);

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<HiveAccount | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>();
  const { identity: userbaseHiveIdentity } = useUserbaseHiveIdentity();
  const { hiveAccount, isLoading: isHiveAccountLoading } = useHiveAccount(
    userbaseHiveIdentity?.handle || ""
  );

  const refreshUser = () => {
    const userData = localStorage.getItem("hiveuser");
    if (userData) {
      setUser(JSON.parse(userData));
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (userbaseHiveIdentity?.handle) {
      setIsLoading(isHiveAccountLoading);
      if (hiveAccount) {
        setUser(hiveAccount);
      }
      return;
    }
    refreshUser();
  }, [userbaseHiveIdentity?.handle, hiveAccount, isHiveAccountLoading]);

  return (
    <HiveUserContext.Provider
      value={{
        hiveUser: user,
        setHiveUser: setUser,
        isLoading,
        refreshUser
      }}
    >
      {children}
    </HiveUserContext.Provider>
  );
};

export const useHiveUser: () => HiveUserContextProps = () => {
  const context = useContext(HiveUserContext);
  if (!context) {
    throw new Error("useHiveUser must be used within a UserProvider");
  }
  return context;
};
