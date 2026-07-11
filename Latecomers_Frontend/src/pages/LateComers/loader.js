import React from 'react';

const LoadingWave = () => {
  const loadingWaveStyle = {
    width: '300px',
    height: '100px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-end',
    zIndex: 9999,
    // marginTop: '300px',
  };

  const loadingBarStyle = {
    width: '20px',
    height: '10px',
    margin: '0 5px',
    backgroundColor: '#3498db',
    borderRadius: '5px',
    animation: 'loading-wave-animation 1s ease-in-out infinite',
  };

  const keyframes = `
    @keyframes loading-wave-animation {
      0% { height: 10px; }
      50% { height: 50px; }
      100% { height: 10px; }
    }
  `;

  return (
    <>
      <style>{keyframes}</style>
      <div style={loadingWaveStyle}>
        {[0, 1, 2, 3].map((_, i) => (
          <div
            key={i}
            style={{
              ...loadingBarStyle,
              animationDelay: `${i * 0.1}s`,
            }}
          />
        ))}
      </div>
    </>
  );
};

export default LoadingWave;
