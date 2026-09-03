import Header from "@/components/shop/Header";
import Footer from "@/components/shop/Footer";
import BackToTop from "@/components/shop/BackToTop";
import "./shop.css";
import FloatingSupportButton from "@/components/shop/FloatingSupportButton";
import CartSyncEffect from "@/components/shop/CartSyncEffect";
import CartRealtimeSync from "@/components/shop/CartRealtimeSync";

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <CartSyncEffect />
      <CartRealtimeSync />
      <Header />
      <main className="flex-1 relative z-10">{children}</main>
      <Footer />
      <FloatingSupportButton />
      <BackToTop />
    </div>
  );
}