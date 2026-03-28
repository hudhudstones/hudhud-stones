import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Upload, Loader2, Sparkles, Link as LinkIcon } from "lucide-react";
import { toast } from "sonner";
import { Link } from "wouter";

interface IdentificationResult {
  stoneName: string;
  confidence: string;
  properties: string[];
  spiritualSignificance: string;
  relatedProducts: Array<{
    id: number;
    name: string;
    price: string;
  }>;
}

export default function StoneIdentifier() {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<IdentificationResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const identifyStone = trpc.ai.identifyStone.useMutation();
  const { data: products } = trpc.products.list.useQuery({});

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setImagePreview(event.target?.result as string);
      setResult(null);
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyze = async () => {
    if (!imagePreview) {
      toast.error("Please select an image first");
      return;
    }

    setIsAnalyzing(true);
    try {
      const base64 = imagePreview.split(",")[1];
      const analysisResult = await identifyStone.mutateAsync({
        imageData: base64,
      });

      // Find related products
      const relatedProducts = products
        ?.filter((p) =>
          analysisResult.stoneName.toLowerCase().includes(p.name.toLowerCase()) ||
          p.name.toLowerCase().includes(analysisResult.stoneName.toLowerCase())
        )
        .slice(0, 3)
        .map((p) => ({
          id: p.id,
          name: p.name,
          price: p.price,
        })) || [];

      setResult({
        ...analysisResult,
        relatedProducts,
      });

      toast.success("Stone identified successfully!");
    } catch (error) {
      toast.error("Failed to identify stone. Please try again.");
      console.error(error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    setImagePreview(null);
    setResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-12">
        {/* Header */}
        <div className="max-w-3xl mx-auto mb-12 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="w-8 h-8 text-primary" />
            <h1 className="text-4xl font-bold text-foreground">Identify My Stone</h1>
          </div>
          <p className="text-lg text-muted-foreground">
            Upload a photo of your stone and let our AI identify its type, properties, and spiritual significance.
          </p>
        </div>

        <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upload Section */}
          <Card className="p-8">
            <h2 className="text-xl font-semibold text-foreground mb-6">Upload Stone Photo</h2>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />

            {!imagePreview ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
              >
                <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-foreground font-medium mb-2">Click to upload or drag and drop</p>
                <p className="text-sm text-muted-foreground">PNG, JPG, GIF up to 5MB</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative aspect-square rounded-lg overflow-hidden bg-muted">
                  <img
                    src={imagePreview}
                    alt="Stone preview"
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleAnalyze}
                    disabled={isAnalyzing}
                    className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Identify Stone
                      </>
                    )}
                  </Button>

                  <Button
                    onClick={handleReset}
                    variant="outline"
                    className="flex-1"
                  >
                    Change Image
                  </Button>
                </div>
              </div>
            )}
          </Card>

          {/* Results Section */}
          <div>
            {result ? (
              <Card className="p-8 space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-2">
                    {result.stoneName}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Confidence: {result.confidence}
                  </p>
                </div>

                {/* Properties */}
                <div>
                  <h3 className="font-semibold text-foreground mb-3">Properties</h3>
                  <div className="space-y-2">
                    {result.properties.map((prop, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                        <p className="text-sm text-muted-foreground">{prop}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Spiritual Significance */}
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Spiritual Significance</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {result.spiritualSignificance}
                  </p>
                </div>

                {/* Related Products */}
                {result.relatedProducts.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-foreground mb-3">Related Products</h3>
                    <div className="space-y-2">
                      {result.relatedProducts.map((product) => (
                        <Link key={product.id} href={`/product/${product.name.toLowerCase().replace(/\s+/g, "-")}`}>
                          <div className="p-3 border border-border rounded-lg hover:bg-muted transition-colors cursor-pointer flex justify-between items-center">
                            <span className="text-sm text-foreground font-medium">{product.name}</span>
                            <span className="text-sm font-bold text-primary">${parseFloat(product.price).toFixed(2)}</span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                <Button
                  onClick={handleReset}
                  variant="outline"
                  className="w-full"
                >
                  Identify Another Stone
                </Button>
              </Card>
            ) : (
              <Card className="p-8 text-center text-muted-foreground">
                <p>Upload an image and click "Identify Stone" to see results here</p>
              </Card>
            )}
          </div>
        </div>

        {/* Info Section */}
        <div className="max-w-3xl mx-auto mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6 text-center">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Upload className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">Upload</h3>
            <p className="text-sm text-muted-foreground">
              Take a clear photo of your stone in natural lighting
            </p>
          </Card>

          <Card className="p-6 text-center">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">Analyze</h3>
            <p className="text-sm text-muted-foreground">
              Our AI analyzes the image to identify the stone type
            </p>
          </Card>

          <Card className="p-6 text-center">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
              <LinkIcon className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">Discover</h3>
            <p className="text-sm text-muted-foreground">
              Find related products and learn more about your stone
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
