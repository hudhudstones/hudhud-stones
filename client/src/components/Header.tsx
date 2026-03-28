import { Link } from "wouter";
import { ShoppingCart, Search, Menu, X, LogIn } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/contexts/CartContext";
import { BRAND, SOCIAL_MEDIA } from "@shared/constants";

export function Header() {
  const { items } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <header className="bg-card border-b border-border sticky top-0 z-50">
      <div className="container py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <img src={BRAND.logo} alt="Hudhud Stones" className="h-10 w-auto" />
            <div className="hidden sm:block">
              <h1 className="text-lg font-bold text-foreground">{BRAND.name}</h1>
              <p className="text-xs text-muted-foreground">{BRAND.tagline}</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/shop" className="text-foreground hover:text-primary transition-colors">
              Shop
            </Link>
            <Link href="/identify-stone" className="text-foreground hover:text-primary transition-colors">
              Identify Stone
            </Link>
            <Link href="/about" className="text-foreground hover:text-primary transition-colors">
              About
            </Link>
            <a
              href={SOCIAL_MEDIA.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground hover:text-primary transition-colors"
              title="Instagram"
            >
              Instagram
            </a>
            <a
              href={SOCIAL_MEDIA.facebook}
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground hover:text-primary transition-colors"
              title="Facebook"
            >
              Facebook
            </a>
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-muted rounded-lg transition-colors">
              <Search className="w-5 h-5" />
            </button>
            <Link href="/cart" className="relative p-2 hover:bg-muted rounded-lg transition-colors">
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* Admin Login Button */}
            <Link href="/admin-login" className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium">
              <LogIn className="w-4 h-4" />
              <span>Admin</span>
            </Link>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 hover:bg-muted rounded-lg transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="md:hidden mt-4 pb-4 flex flex-col gap-3 border-t border-border pt-4">
            <Link href="/shop" className="text-foreground hover:text-primary transition-colors">
              Shop
            </Link>
            <Link href="/about" className="text-foreground hover:text-primary transition-colors">
              About
            </Link>
            <a
              href={SOCIAL_MEDIA.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground hover:text-primary transition-colors"
            >
              Instagram
            </a>
            <a
              href={SOCIAL_MEDIA.facebook}
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground hover:text-primary transition-colors"
            >
              Facebook
            </a>
          </nav>
        )}
      </div>
    </header>
  );
}
