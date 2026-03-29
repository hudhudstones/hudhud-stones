import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { Loader2, X, Upload } from "lucide-react";
import { toast } from "sonner";

interface ProductFormProps {
  product?: any;
  onClose: () => void;
}

export default function ProductForm({ product, onClose }: ProductFormProps) {
  const [formData, setFormData] = useState({
    name: product?.name || "",
    slug: product?.slug || "",
    description: product?.description || "",
    categoryId: product?.categoryId || 1,
    price: product?.price || "",
    cost: product?.cost || "",
    stock: product?.stock || 0,
    featured: product?.featured || false,
  });

  const [images, setImages] = useState<string[]>(product?.images || []);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: categories } = trpc.categories.list.useQuery();
  const createProduct = trpc.products.create.useMutation();
  const updateProduct = trpc.products.update.useMutation();
  const uploadImage = trpc.products.uploadImage.useMutation();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    setUploading(true);
    try {
      const uploadPromises = Array.from(files).map((file) => {
        return new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = async (event) => {
            try {
              const base64 = (event.target?.result as string).split(",")[1];
              const result = await uploadImage.mutateAsync({
                file: base64,
                filename: file.name,
                mimeType: file.type || 'image/jpeg',
              });
              resolve(result.url);
            } catch (error) {
              reject(error);
            }
          };
          reader.onerror = () => {
            reject(new Error("Failed to read file"));
          };
          reader.readAsDataURL(file);
        });
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      setImages((prev) => [...prev, ...uploadedUrls]);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Failed to upload image";
      toast.error(errorMsg);
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.slug || !formData.price) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (uploading) {
      toast.error("Please wait for images to finish uploading");
      return;
    }

    try {
      if (product) {
        await updateProduct.mutateAsync({
          id: product.id,
          ...formData,
          images,
        });
        toast.success("Product updated successfully");
      } else {
        await createProduct.mutateAsync({
          ...formData,
          images,
        });
        toast.success("Product created successfully");
      }
      onClose();
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Failed to save product";
      toast.error(errorMsg);
    }
  };

  return (
    <Card className="p-6 mb-8 border-2 border-primary/50">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-foreground">
          {product ? "Edit Product" : "Create Product"}
        </h2>
        <button onClick={onClose} className="p-1 hover:bg-muted rounded">
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Product Name *
            </label>
            <Input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="e.g., Premium Masbaha"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Slug *
            </label>
            <Input
              type="text"
              name="slug"
              value={formData.slug}
              onChange={handleInputChange}
              placeholder="e.g., premium-masbaha"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="Product description..."
            rows={4}
            className="w-full px-3 py-2 border border-border rounded-lg bg-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Category *
            </label>
            <select
              name="categoryId"
              value={formData.categoryId}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-border rounded-lg bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              required
            >
              {categories?.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Price ($) *
            </label>
            <Input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleInputChange}
              placeholder="0.00"
              step="0.01"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Cost ($) <span className="text-xs text-muted-foreground">(Admin only)</span>
            </label>
            <Input
              type="number"
              name="cost"
              value={formData.cost}
              onChange={handleInputChange}
              placeholder="0.00"
              step="0.01"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Stock
            </label>
            <Input
              type="number"
              name="stock"
              value={formData.stock}
              onChange={handleInputChange}
              placeholder="0"
              min="0"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            name="featured"
            checked={formData.featured}
            onChange={handleInputChange}
            className="w-4 h-4 rounded border-border"
          />
          <label className="text-sm font-medium text-foreground">
            Featured Product
          </label>
        </div>

        {/* Image Upload */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Product Images
          </label>
          <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading || createProduct.isPending || updateProduct.isPending}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Upload Images
                </>
              )}
            </button>
          </div>

          {/* Image Preview */}
          {images.length > 0 && (
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
              {images.map((img, idx) => (
                <div key={idx} className="relative group">
                  <img
                    src={img}
                    alt={`Product ${idx + 1}`}
                    className="w-full h-24 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => setImages(images.filter((_, i) => i !== idx))}
                    className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-4 pt-6 border-t border-border">
          <Button
            type="submit"
            disabled={uploading || createProduct.isPending || updateProduct.isPending}
            className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {createProduct.isPending || updateProduct.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {product ? "Updating..." : "Creating..."}
              </>
            ) : (
              product ? "Update Product" : "Create Product"
            )}
          </Button>
          <Button
            type="button"
            onClick={onClose}
            variant="outline"
            className="flex-1"
            disabled={uploading || createProduct.isPending || updateProduct.isPending}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}
