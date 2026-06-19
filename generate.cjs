const fs = require('fs');

const code = `
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const LOGO_URL = "https://lh3.googleusercontent.com/pw/AP1GczMk0hS3jdTwzJkHeGWSWRjqaUS5YYGFB5KbMDMeFlBdpving26XUlJjNeBV5Hgu1LMFBhJva188u3oI3ki789nXcjxoVTfjk5LDpRs7y0gszs7daOP8=s512";

export default function LandingPage() {
  const navigate = useNavigate();
  
  useEffect(() => {
    // If we want to use the iframe approach:
    // window.location.href = '/landing.html';
  }, []);

  return (
    <div className="w-full h-screen">
      <iframe src="/landing.html" className="w-full h-full border-none" title="Landing Page" />
    </div>
  );
}
`;
fs.writeFileSync('src/components/LandingPage.tsx', code);
