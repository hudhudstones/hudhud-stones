import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Loader2 } from "lucide-react";
import { BRAND } from "@shared/constants";

export default function Home() {
  const { data: allProducts, isLoading } = trpc.products.list.useQuery({});
  const featured = allProducts?.filter((p) => p.featured).slice(0, 3) || [];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-muted to-background py-20 md:py-32">
        <div className="container">
          <div className="max-w-2xl mx-auto text-center">
            <img src={BRAND.logo} alt={BRAND.name} className="h-20 w-auto mx-auto mb-6" />
            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-4">
              {BRAND.name}
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Discover authentic masbaha and precious stones for spiritual reflection and timeless elegance.
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/shop">
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                  Shop Now
                </Button>
              </Link>
              <Link href="/about">
                <Button variant="outline">Learn More</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 md:py-24">
        <div className="container">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 text-center">
            Featured Collection
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Handpicked selections from our finest collection of masbaha and precious stones.
          </p>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : featured && featured.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {featured.map((product) => (
                <Link key={product.id} href={`/product/${product.slug}`}>
                  <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer h-full">
                    {product.images[0] && (
                      <div className="aspect-square bg-muted overflow-hidden">
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="w-full h-full object-cover hover:scale-105 transition-transform"
                        />
                      </div>
                    )}
                    <div className="p-4">
                      <h3 className="font-semibold text-foreground mb-2 line-clamp-2">
                        {product.name}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                        {product.description}
                      </p>
                      <p className="text-lg font-bold text-primary">
                        ${parseFloat(product.price).toFixed(2)}
                      </p>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No featured products available yet.</p>
            </div>
          )}
        </div>
      </section>

      {/* Categories Preview */}
      <section className="py-16 md:py-24 bg-muted/50">
        <div className="container">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-12 text-center">
            Shop by Category
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Link href="/shop?category=masbaha">
              <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                <div className="aspect-video bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                  <h3 className="text-2xl font-bold text-foreground">Masbaha</h3>
                </div>
                <div className="p-6">
                  <p className="text-muted-foreground">
                    Traditional prayer beads crafted with care and precision.
                  </p>
                </div>
              </Card>
            </Link>
            <Link href="/shop?category=stones">
              <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                <div className="aspect-video bg-gradient-to-br from-secondary/20 to-accent/20 flex items-center justify-center">
                  <h3 className="text-2xl font-bold text-foreground">Precious Stones</h3>
                </div>
                <div className="p-6">
                  <p className="text-muted-foreground">
                    Rare and beautiful stones selected for their natural beauty.
                  </p>
                </div>
              </Card>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-primary text-primary-foreground">
        <div className="container text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Explore?
          </h2>
          <p className="text-lg mb-8 opacity-90 max-w-2xl mx-auto">
            Browse our complete collection and find the perfect masbaha or precious stone for you.
          </p>
          <Link href="/shop">
            <Button className="bg-primary-foreground text-primary hover:bg-primary-foreground/90">
              View All Products
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
