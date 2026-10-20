import { useEffect } from 'react';

const SmoothScroll = ({ children }) => {
  useEffect(() => {
    // Enable native smooth scrolling via CSS
    document.documentElement.style.scrollBehavior = 'smooth';

    return () => {
      document.documentElement.style.scrollBehavior = '';
    };
  }, []);

  return <div className="relative">{children}</div>;
};

export default SmoothScroll;
