import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

const PopupContext = createContext();

export const usePopup = () => useContext(PopupContext);

export const PopupProvider = ({ children }) => {
  const [popups, setPopups] = useState([]);

  const showAlert = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random();
    setPopups((prev) => [...prev, { id, message, type, isConfirm: false }]);

    // Auto remove after 3 seconds for alerts
    setTimeout(() => {
      setPopups((prev) => prev.filter((p) => p.id !== id));
    }, 3000);
  }, []);

  const showConfirm = useCallback((message) => {
    return new Promise((resolve) => {
      const id = Date.now() + Math.random();
      const handleClose = (result) => {
        setPopups((prev) => prev.filter((p) => p.id !== id));
        resolve(result);
      };

      setPopups((prev) => [...prev, { id, message, type: 'confirm', isConfirm: true, onResolve: handleClose }]);
    });
  }, []);

  return (
    <PopupContext.Provider value={{ showAlert, showConfirm }}>
      {children}
      <div style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        pointerEvents: 'none', // let clicks pass through the container
      }}>
        {popups.map((popup) => (
          <div
            key={popup.id}
            style={{
              backgroundColor: 'white',
              boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
              borderRadius: '8px',
              padding: '16px 20px',
              minWidth: '280px',
              maxWidth: '380px',
              pointerEvents: 'auto', // but capture clicks on the toast itself
              animation: 'slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
              borderLeft: popup.type === 'confirm' ? '4px solid #f59e0b' : '4px solid #3b82f6',
              fontFamily: 'sans-serif'
            }}
          >
            <div style={{ marginBottom: popup.isConfirm ? '12px' : '0', fontSize: '0.95rem', color: '#1f2937', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
              {popup.message}
            </div>
            {popup.isConfirm && (
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => popup.onResolve(false)}
                  style={{
                    padding: '6px 14px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    backgroundColor: '#ffffff',
                    color: '#374151',
                    fontSize: '0.85rem',
                    fontWeight: '500',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseOver={(e) => e.target.style.backgroundColor = '#f3f4f6'}
                  onMouseOut={(e) => e.target.style.backgroundColor = '#ffffff'}
                >
                  ยกเลิก
                </button>
                <button
                  onClick={() => popup.onResolve(true)}
                  style={{
                    padding: '6px 14px',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    fontSize: '0.85rem',
                    fontWeight: '500',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseOver={(e) => e.target.style.backgroundColor = '#2563eb'}
                  onMouseOut={(e) => e.target.style.backgroundColor = '#3b82f6'}
                >
                  ตกลง
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
      <style>
        {`
          @keyframes slideInRight {
            0% { transform: translateX(120%); opacity: 0; }
            100% { transform: translateX(0); opacity: 1; }
          }
        `}
      </style>
    </PopupContext.Provider>
  );
};

