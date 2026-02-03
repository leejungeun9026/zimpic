import Features from '../components/Main/Features';
import Hero from '../components/Main/Hero';
import Steps from '../components/Main/Steps';
import Estimate from '../components/Main/Estimate';
import Recommend from '../components/Main/Recommend';
import CTASection from '../components/Main/CTASection';
import '../components/Main/Main.css';


const MainPage = () => {
  return (
    <>
      <Hero />
      <Features />
      <Steps />
      <Estimate />
      <Recommend />
      <CTASection />
    </>
  );
};

export default MainPage;
