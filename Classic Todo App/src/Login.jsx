import React from 'react';
import { signInWithPopup } from 'firebase/auth';
import { auth, provider } from './firebase';

export default function Login() {
  const modelRef = React.useRef(null);
  const btnRef = React.useRef(null);

  React.useEffect(() => {
    let start = performance.now();
    let frameId;

    const animate = (time) => {
      if (!modelRef.current) return;
      
      const duration = 6000;
      const progress = (time - start) % duration;
      const ratio = progress / duration;

      const btn = btnRef.current;
      const rawW = btn ? btn.offsetWidth : 240; 
      const rawH = btn ? btn.offsetHeight : 50; 
      
      const GAP = 18; // Inward offset to eliminate 3D padding gap
      const minX = GAP;
      const maxX = rawW - GAP;
      const minY = GAP;
      const maxY = rawH - GAP;

      let x = 0;
      let y = 0;
      let rotZ = 0;

      if (ratio < 0.30) {
        x = minX + (ratio / 0.30) * (maxX - minX);
        y = minY;
        rotZ = 0;
      } else if (ratio < 0.35) {
        x = maxX;
        y = minY;
        rotZ = ((ratio - 0.30) / 0.05) * 90;
      } else if (ratio < 0.45) {
        x = maxX;
        y = minY + ((ratio - 0.35) / 0.10) * (maxY - minY);
        rotZ = 90;
      } else if (ratio < 0.50) {
        x = maxX;
        y = maxY;
        rotZ = 90 + ((ratio - 0.45) / 0.05) * 90;
      } else if (ratio < 0.80) {
        x = maxX - (((ratio - 0.50) / 0.30) * (maxX - minX));
        y = maxY;
        rotZ = 180;
      } else if (ratio < 0.85) {
        x = minX;
        y = maxY;
        rotZ = 180 + ((ratio - 0.80) / 0.05) * 90;
      } else if (ratio < 0.95) {
        x = minX;
        y = maxY - (((ratio - 0.85) / 0.10) * (maxY - minY));
        rotZ = 270;
      } else {
        x = minX;
        y = minY;
        rotZ = 270 + ((ratio - 0.95) / 0.05) * 90;
      }

      modelRef.current.style.transform = `translate(${x}px, ${y}px) rotateZ(${rotZ}deg)`;
      // Keep internal orientation fixed forward, rely on rotateZ for 2D screen planar rotation
      modelRef.current.orientation = `0deg 0deg 0deg`;
      
      frameId = requestAnimationFrame(animate);
    };

    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, []);

  const signIn = async () => {
    try {
      await signInWithPopup(auth, provider);
    } catch (err) {
      console.error("Login failed: ", err);
    }
  };

  return (
    <div className="login-screen desk-container">
      <div className="login-journal">
        <h1 className="login-title">Classic Notepad</h1>
        <p className="login-subtitle">Your task is your goal.</p>
        <div className="google-btn-wrapper">
          <model-viewer 
            ref={modelRef}
            className="squirrel" 
            src="https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Fox/glTF-Binary/Fox.glb" 
            alt="3D Running Fox" 
            autoplay 
            animation-name="Run"
            camera-orbit="-90deg 90deg 100%"
            camera-controls={false}
            interaction-prompt="none"
            style={{ backgroundColor: 'transparent' }}
          ></model-viewer>
          <button ref={btnRef} className="google-btn" onClick={signIn}>
            <img 
              src="https://developers.google.com/identity/images/g-logo.png" 
              alt="Google" 
              width="24" 
              height="24" 
            />
            Sign in with Google
          </button>
        </div>
      </div>
    </div>
  );
}
