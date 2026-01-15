"use client";

import {
  createContext,
  useContext,
  useState,
  ReactNode,
} from "react";

type PopupContextType = {
  openPopup: (content: ReactNode) => void;
  closePopup: () => void;
};

const PopupContext = createContext<PopupContextType | null>(null);

export const PopupProvider = ({ children }: { children: ReactNode }) => {
  const [content, setContent] = useState<ReactNode | null>(null);

  const openPopup = (node: ReactNode) => {
    setContent(node);
  };

  const closePopup = () => {
    setContent(null);
  };

  return (
    <PopupContext.Provider value={{ openPopup, closePopup }}>
      {children}

      {content && (
        <div
          onClick={closePopup}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div onClick={(e) => e.stopPropagation()}>
            {content}
          </div>
        </div>
      )}
    </PopupContext.Provider>
  );
};

export const usePopup = () => {
  const ctx = useContext(PopupContext);
  if (!ctx) {
    throw new Error("usePopup must be used inside PopupProvider");
  }
  return ctx;
};
