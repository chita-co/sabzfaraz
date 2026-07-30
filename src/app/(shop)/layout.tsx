import Header from "@/components/shop/Header";
import TopFilterBar from "@/components/shop/TopFilterBar";
import Footer from "@/components/shop/Footer";
import BackToTop from "@/components/shop/BackToTop";
import "./shop.css";

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <TopFilterBar />
      <main className="flex-1 relative z-10 bg-white">
        {children}
      </main>
      <Footer />
      <BackToTop />
    </div>
  );
}