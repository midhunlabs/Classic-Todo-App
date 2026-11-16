import React, { useState, useEffect } from 'react';

export default function SpecialPage({ user, onSignOut, onContinue }) {
  const [displayedText, setDisplayedText] = useState('');
  const [showContinue, setShowContinue] = useState(false);
  const [scrollOpen, setScrollOpen] = useState(false);

  const fullText = "Hi Shahi Welcome 👋🏻😃 , Enikkariyayirunn iyy eth account nna login cheyyunne enn.i sure this app will help you";
  // Safe array conversion to prevent splitting emoji emojis surrogate pairs
  const fullTextArray = Array.from(fullText);

  // Wait for the CSS parchment scroll to visually finish unrolling
  useEffect(() => {
    const scrollTimer = setTimeout(() => {
      setScrollOpen(true);
    }, 2800); // 0.5s delay + 2.3s animation duration

    return () => clearTimeout(scrollTimer);
  }, []);

  // Typewriter effect logic
  useEffect(() => {
    if (scrollOpen) {
      let index = 0;
      const typeTimer = setInterval(() => {
        setDisplayedText(fullTextArray.slice(0, index).join(''));
        index++;
        if (index > fullTextArray.length) {
          clearInterval(typeTimer);
          setTimeout(() => setShowContinue(true), 600); // Pause before fading in button
        }
      }, 45); // Typing speed
      return () => clearInterval(typeTimer);
    }
  }, [scrollOpen]);

  return (
    <div className="desk-container special-desk">
      <div className="user-profile-widget" style={{position:'absolute', top: 20, right: 20, zIndex: 10}}>
        {user && user.photoURL && (
          <img src={user.photoURL} alt="Profile" className="profile-pic" title={user.displayName || "User"} />
        )}
        <button onClick={onSignOut} className="logout-btn" title="Sign Out">✖</button>
      </div>

      <div className="scroll-wrapper">
        <div className="scroll-top-roller">
          <div className="scroll-cap left-cap"></div>
          <div className="scroll-cap right-cap"></div>
        </div>
        
        <div className="parchment-paper">
          <div className="scroll-content">
            <p className="typewriter-text">{displayedText}</p>
            {showContinue && (
              <button className="continue-btn fade-in" onClick={onContinue}>Continue to Application</button>
            )}
          </div>
        </div>
        
        <div className="scroll-bottom-roller">
          <div className="scroll-cap left-cap"></div>
          <div className="scroll-cap right-cap"></div>
        </div>
      </div>
    </div>
  );
}
