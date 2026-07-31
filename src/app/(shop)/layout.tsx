import Header from "@/components/shop/Header";
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
      <main className="flex-1 relative z-10">{children}</main>
      <Footer />
      <BackToTop />
    </div>
  );
}