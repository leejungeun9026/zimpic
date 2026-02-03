import { Routes, Route } from "react-router-dom";
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";

import HomePage from "./pages/HomePage";
import AICheckPage from "./pages/AICheckPage";
import AddressPage from "./pages/AddressPage";
import ResultPage from "./pages/ResultPage";
import MainPage from "./pages/MainPage";
import LayoutWithWrapper from "./components/layout/LayoutWithWrapper";
import { useEffect } from "react";
import { useEstimateStore } from "./store/estimateStore";


function App() {
  useEffect(() => {
    useEstimateStore.getState().hydrateRoomImages?.();
  }, []);
  return (
    <div className="d-flex flex-column min-vh-100">
      <Header />
      <main className="flex-grow-1">
        <Routes>
          <Route path="/" element={<MainPage />} />
          <Route element={<LayoutWithWrapper />}>
            <Route path="/HomePage" element={<HomePage />} />
            <Route path="/AICheckPage" element={<AICheckPage />} />
            <Route path="/AddressPage" element={<AddressPage />} />
            <Route path="/ResultPage" element={<ResultPage />} />
          </Route>
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default App;
