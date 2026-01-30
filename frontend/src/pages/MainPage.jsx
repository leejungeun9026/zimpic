import React from 'react';
import Hero from '../components/Main/Hero';
import Features from '../components/Main/Features';
import Steps from '../components/Main/Steps';
import Trust from '../components/Main/Trust';
import CTASection from '../components/Main/CTASection';
import '../components/Main/Main.css';

import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const MainPage = () => {

  const location = useLocation();

  useEffect(() => {
    if (!location.hash) return;

    const id = location.hash.replace("#", "");
    const el = document.getElementById(id);

    if (el) {
      // 헤더가 sticky-top이면 약간의 여유를 주고 싶을 수 있음
      const y = el.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  }, [location.hash]);

  return (
      <div className="main-page">
          <Hero />
          <Features />
          <Steps />
          <Trust />
          <CTASection />
      </div>
  );
};

export default MainPage;
