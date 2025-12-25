import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import ProductGrid from "@/components/ProductGrid";
import Cart from "@/components/Cart";

export default function Home() {
  return (
    <main className="min-h-screen bg-black">
      <Navbar />
      <Hero />
      <ProductGrid />
      <Cart />

      {/* Footer */}
      <footer className="bg-neutral-900 border-t border-neutral-800 text-gray-500 py-12 text-center">
        <div className="max-w-7xl mx-auto px-4">
          <p className="mb-4 text-white font-bold tracking-widest text-sm uppercase">Samurai Gaming</p>
          <p>© {new Date().getFullYear()} All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}
