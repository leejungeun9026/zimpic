import { Routes, Route } from "react-router-dom";
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";

import HomePage from "./pages/HomePage";
import AICheckPage from "./pages/AICheckPage";
import AddressPage from "./pages/AddressPage";
import ResultPage from "./pages/ResultPage";
import MainPage from "./pages/MainPage";


function App() {
  return (
    <div className="d-flex flex-column min-vh-100">
      <Header />

      <main>
        <Routes>
          <Route path="/" element={<MainPage />} />
        </Routes>

        {/* 나머지 페이지는 기존처럼 좁게 */}
        <div className="content-wrapper">
          <Routes>
            <Route path="/HomePage" element={<HomePage />} />
            <Route path="/AICheckPage" element={<AICheckPage />} />
            <Route path="/AddressPage" element={<AddressPage />} />
            <Route path="/ResultPage" element={<ResultPage />} />
          </Routes>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default App;
