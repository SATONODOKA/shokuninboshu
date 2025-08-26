import { useState, useEffect } from 'react';

export type Route = '/' | '/monitor';

class SimpleRouter {
  private listeners: (() => void)[] = [];
  private currentPath: Route = '/';

  constructor() {
    if (typeof window !== 'undefined') {
      this.currentPath = this.getPathFromUrl();
      window.addEventListener('popstate', this.handlePopState);
    }
  }

  private getPathFromUrl(): Route {
    const path = window.location.pathname;
    return path === '/monitor' ? '/monitor' : '/';
  }

  private handlePopState = () => {
    this.currentPath = this.getPathFromUrl();
    this.notifyListeners();
  };

  private notifyListeners() {
    this.listeners.forEach(listener => listener());
  }

  navigate(path: Route) {
    if (typeof window === 'undefined') return;
    
    this.currentPath = path;
    window.history.pushState(null, '', path);
    this.notifyListeners();
  }

  getCurrentPath(): Route {
    return this.currentPath;
  }

  subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  destroy() {
    if (typeof window !== 'undefined') {
      window.removeEventListener('popstate', this.handlePopState);
    }
    this.listeners = [];
  }
}

export const router = new SimpleRouter();

export function useRouter() {
  const [path, setPath] = useState<Route>(router.getCurrentPath());

  useEffect(() => {
    return router.subscribe(() => {
      setPath(router.getCurrentPath());
    });
  }, []);

  return {
    path,
    navigate: router.navigate.bind(router)
  };
}