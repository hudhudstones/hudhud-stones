import { useState } from "react";
import { useRoute, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { useCart } from "@/contexts/CartContext";
import { Loader2, ChevronLeft, ShoppingCart, Share2 } from "lucide-react";
import { toast } from "sonner";
import { ImageGallery } from "@/components/ImageGallery";
import { shareOnWhatsApp } from "@/lib/whatsapp";

export default function ProductDetail() {
  const [, params] = useRoute("/product/:slug");
  const [quantity, setQuantity] = useState(1);
  const { addItem } = useCart();

  const { data: product, isLoading } = trpc.products.bySlug.useQuery(
    { slug: params?.slug || "" },
    { enabled: !!params?.slug }
  );

  const handleAddToCart = () => {
    if (!product) return;

    addItem({
      productId: product.id,
      productName: product.name,
      price: product.price,
      quantity,
      image: product.images[0],
    });

    toast.success(`${product.name} added to cart!`);
    setQuantity(1);
  };

  const handleShareWhatsApp = () => {
    if (!product) return;

    shareOnWhatsApp({
      productName: product.name,
      productPrice: product.price,
      productUrl: `/product/${product.slug}`,
      message: `Check out this beautiful ${product.name} from Hudhud Stones! 💎\n\nPrice: $${parseFloat(product.price).toFixed(2)}\n\n${product.description}\n\nLink: ${window.location.origin}/product/${product.slug}`,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold text-foreground">Product not found</h1>
        <Link href="/shop">
          <Button>Back to Shop</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8">
        {/* Breadcrumb */}
        <Link href="/shop" className="flex items-center gap-2 text-muted-foreground hover:text-primary mb-8">
          <ChevronLeft className="w-4 h-4" />
          Back to Shop
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Image Gallery */}
          <div>
            <ImageGallery images={product.images} productName={product.name} />
          </div>

          {/* Product Info */}
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              {product.name}
            </h1>

            <p className="text-lg text-muted-foreground mb-6">
              {product.description}
            </p>

            {/* Price and Stock */}
            <div className="mb-8">
              <p className="text-4xl font-bold text-primary mb-2">
                ${parseFloat(product.price).toFixed(2)}
              </p>
              <p className={`text-sm font-medium ${
                product.stock > 0 ? "text-green-600" : "text-destructive"
              }`}>
                {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
              </p>
            </div>

            {/* Add to Cart & Share */}
            <Card className="p-6 mb-8">
              <div className="flex gap-4 mb-6">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Quantity
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="px-3 py-2 border border-border rounded hover:bg-muted"
                    >
                      −
                    </button>
                    <Input
                      type="number"
                      min="1"
                      max={product.stock}
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-16 text-center"
                    />
                    <button
                      onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                      className="px-3 py-2 border border-border rounded hover:bg-muted"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleAddToCart}
                  disabled={product.stock <= 0}
                  className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Add to Cart
                </Button>
                <Button
                  onClick={handleShareWhatsApp}
                  variant="outline"
                  className="px-4"
                  title="Share on WhatsApp"
                >
                  <Share2 className="w-4 h-4" />
                </Button>
              </div>
            </Card>

            {/* Product Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">Product Details</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">SKU</p>
                  <p className="text-foreground font-medium">{product.slug}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Category</p>
                  <p className="text-foreground font-medium">
                    {product.categoryId === 1 ? "Masbaha" : "Precious Stones"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
