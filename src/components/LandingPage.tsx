import React, { useEffect } from 'react';

export default function LandingPage() {
  useEffect(() => {
    window.location.replace('/landing.html');
  }, []);

  return null;
}
