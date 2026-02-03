import CTASection from '../components/Main/CTASection';
import Features from '../components/Main/Features';
import Hero from '../components/Main/Hero';
import Recommend from '../components/Main/Recommend';
import Steps from '../components/Main/Steps';
import StepSimulator from '../components/Main/StepSimulator';

import '../components/Main/Main.css';

const MainPage = () => {
  return (
    <>
      <Hero />
      <Features />
      <Steps />
      <StepSimulator />
      <Recommend />
      <CTASection />
    </>
  );
};

export default MainPage;
