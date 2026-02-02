import CTASection from '../components/Main/CTASection';
import Features from '../components/Main/Features';
import Hero from '../components/Main/Hero';
import '../components/Main/Main.css';
import Steps from '../components/Main/Steps';

import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import Recommend from '../components/Main/Recommend';
import Estimate from '../components/Main/Estimate';


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
      <Estimate />
      <Recommend />
      <CTASection />
    </div>
  );
};

export default MainPage;
