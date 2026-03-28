import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { Loader2, X, Share2 } from "lucide-react";
import { shareOnWhatsApp } from "@/lib/whatsapp";

export default function Shop() {
  const [location] = useLocation();
  const params = new URLSearchParams(location.split("?")[1] || "");
  
  const [search, setSearch] = useState(params.get("search") || "");
  const [categoryFilter, setCategoryFilter] = useState(params.get("category") || "");
  const [minPrice, setMinPrice] = useState(params.get("minPrice") || "");
  const [maxPrice, setMaxPrice] = useState(params.get("maxPrice") || "");

  const { data: products, isLoading: productsLoading } = trpc.products.list.useQuery({
    search: search || undefined,
    categoryId: categoryFilter ? parseInt(categoryFilter) : undefined,
    minPrice: minPrice ? parseFloat(minPrice) : undefined,
    maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
  });

  const { data: categories, isLoading: categoriesLoading } = trpc.categories.list.useQuery();

  const hasFilters = search || categoryFilter || minPrice || maxPrice;

  const clearFilters = () => {
    setSearch("");
    setCategoryFilter("");
    setMinPrice("");
    setMaxPrice("");
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8">
        <h1 className="text-4xl font-bold text-foreground mb-8">Shop</h1>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-card rounded-lg p-6 border border-border sticky top-24">
              <h2 className="text-lg font-semibold text-foreground mb-6">Filters</h2>

              {/* Search */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Search
                </label>
                <Input
                  type="text"
                  placeholder="Search products..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full"
                />
              </div>

              {/* Categories */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Category
                </label>
                {categoriesLoading ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <button
                      onClick={() => setCategoryFilter("")}
                      className={`w-full text-left px-3 py-2 rounded transition-colors ${
                        !categoryFilter
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-muted"
                      }`}
                    >
                      All Categories
                    </button>
                    {categories?.map((category) => (
                      <button
                        key={category.id}
                        onClick={() => setCategoryFilter(category.id.toString())}
                        className={`w-full text-left px-3 py-2 rounded transition-colors ${
                          categoryFilter === category.id.toString()
                            ? "bg-primary text-primary-foreground"
                            : "hover:bg-muted"
                        }`}
                      >
                        {category.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Price Range */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Price Range
                </label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    className="w-1/2"
                  />
                  <Input
                    type="number"
                    placeholder="Max"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    className="w-1/2"
                  />
                </div>
              </div>

              {/* Clear Filters */}
              {hasFilters && (
                <Button
                  onClick={clearFilters}
                  variant="outline"
                  className="w-full"
                >
                  <X className="w-4 h-4 mr-2" />
                  Clear Filters
                </Button>
              )}
            </div>
          </div>

          {/* Products Grid */}
          <div className="lg:col-span-3">
            {productsLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : products && products.length > 0 ? (
              <>
                <p className="text-sm text-muted-foreground mb-6">
                  Showing {products.length} product{products.length !== 1 ? "s" : ""}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {products.map((product) => (
                    <div key={product.id} className="group">
                      <Link href={`/product/${product.slug}`}>
                        <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer h-full">
                          {product.images[0] && (
                            <div className="aspect-square bg-muted overflow-hidden relative">
                              <img
                                src={product.images[0]}
                                alt={product.name}
                                className="w-full h-full object-cover hover:scale-105 transition-transform"
                              />
                              {/* WhatsApp Share Button */}
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  shareOnWhatsApp({
                                    productName: product.name,
                                    productPrice: product.price,
                                    productUrl: `/product/${product.slug}`,
                                  });
                                }}
                                className="absolute top-2 right-2 bg-green-500 hover:bg-green-600 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                title="Share on WhatsApp"
                              >
                                <Share2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                          <div className="p-4">
                            <h3 className="font-semibold text-foreground mb-2 line-clamp-2">
                              {product.name}
                            </h3>
                            <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                              {product.description}
                            </p>
                            <div className="flex justify-between items-center">
                              <p className="text-lg font-bold text-primary">
                                ${parseFloat(product.price).toFixed(2)}
                              </p>
                              {product.stock <= 0 && (
                                <span className="text-xs bg-destructive/20 text-destructive px-2 py-1 rounded">
                                  Out of Stock
                                </span>
                              )}
                            </div>
                          </div>
                        </Card>
                      </Link>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">No products found.</p>
                {hasFilters && (
                  <Button onClick={clearFilters} variant="outline">
                    Clear Filters
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
