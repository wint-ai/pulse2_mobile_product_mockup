import { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth <= 500 || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
      setIsMobile(mobile);
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return isMobile;
}

function MobileLayout({ children, bgSolid }) {
  return (
    <>
      <style>{`
        .mobile-shell {
          width: 100vw;
          height: 100vh;
          height: 100dvh;
          height: -webkit-fill-available;
          max-height: 100vh;
          max-height: 100dvh;
          max-height: -webkit-fill-available;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          background: ${bgSolid};
          position: fixed;
          top: 0;
          left: 0;
        }
      `}</style>
      <div className="mobile-shell">
        {children}
      </div>
    </>
  );
}

function DesktopFrame({ children, theme }) {
  return (
    <div className="flex items-start justify-center min-h-screen p-6" style={{ background: '#DDE1E8' }}>
      <div style={{
        width: 393, height: 852,
        background: theme.phoneBg,
        borderRadius: 46,
        border: '9px solid #0D0D0D',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        boxShadow: '0 20px 60px rgba(0,0,0,.25)',
        flexShrink: 0,
        zoom: 1.08,
      }}>
        <div style={{
          height: 44,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          fontSize: 14,
          fontWeight: 600,
          flexShrink: 0,
          background: theme.statusBarBg,
          color: theme.statusBarColor,
        }}>
          <span>9:41</span>
          <span style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
            <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
              <rect x="0" y="4" width="3" height="8" rx="1" fill={theme.statusBarColor}/>
              <rect x="4.5" y="2.5" width="3" height="9.5" rx="1" fill={theme.statusBarColor}/>
              <rect x="9" y="0.5" width="3" height="11.5" rx="1" fill={theme.statusBarColor}/>
              <rect x="13.5" y="0" width="2" height="12" rx="1" fill={theme.statusBarColor} opacity="0.3"/>
            </svg>
            <svg width="15" height="12" viewBox="0 0 15 12" fill="none">
              <path d="M7.5 2C9.8 2 11.8 3 13.2 4.7L14.5 3.2C12.7 1.2 10.2 0 7.5 0S2.3 1.2.5 3.2L1.8 4.7C3.2 3 5.2 2 7.5 2Z" fill={theme.statusBarColor}/>
              <path d="M7.5 5C9 5 10.3 5.6 11.3 6.6L12.6 5.1C11.2 3.8 9.4 3 7.5 3S3.8 3.8 2.4 5.1L3.7 6.6C4.7 5.6 6 5 7.5 5Z" fill={theme.statusBarColor}/>
              <circle cx="7.5" cy="10" r="2" fill={theme.statusBarColor}/>
            </svg>
            <span>100%</span>
          </span>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function Phone({ children }) {
  const isMobile = useIsMobile();
  const { theme } = useTheme();
  return isMobile
    ? <MobileLayout bgSolid={theme.bgSolid}>{children}</MobileLayout>
    : <DesktopFrame theme={theme}>{children}</DesktopFrame>;
}
