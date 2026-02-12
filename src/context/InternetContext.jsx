import { createContext, useEffect, useState } from "react";

export const InternetContext = createContext();

export const InternetProvider = ({ children }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);

    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);

    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  return (
    <InternetContext.Provider value={{ isOnline }}>
      {children}
    </InternetContext.Provider>
  );
};