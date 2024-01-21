import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

type WindowSize = {
  width: number;
  height: number;
};

type WindowContext = WindowSize & {
  isMobile: boolean;
};

const WindowContext = createContext<WindowContext | null>(null);

type WindowContextProviderProps = {
  children: ReactNode;
};
export function WindowContextProvider({
  children
}: WindowContextProviderProps): JSX.Element {
  const [windowSize, setWindowSize] = useState<WindowSize>({
    width: typeof window !== 'undefined' ? window.innerWidth : 9999,
    height: typeof window !== 'undefined' ? window.innerHeight : 9999
  });

  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    const handleResize = (): void => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      setWindowSize({
        width,
        height
      });

      setIsMobile(width < 500);
    };

    handleResize(); // Initially set the size and isMobile

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const value: WindowContext = {
    ...windowSize,
    isMobile
  };

  return (
    <WindowContext.Provider value={value}>{children}</WindowContext.Provider>
  );
}

export function useWindow(): WindowContext {
  const context = useContext(WindowContext);

  if (!context)
    throw new Error('useWindow must be used within an WindowContextProvider');

  return context;
}
