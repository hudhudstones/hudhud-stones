import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";

export default function OrderConfirmation() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container py-16">
        <div className="max-w-2xl mx-auto text-center">
          <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-6" />
          
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Order Confirmed!
          </h1>
          
          <p className="text-lg text-muted-foreground mb-8">
            Thank you for your purchase. Your order has been received and is being processed.
          </p>

          <Card className="p-8 mb-8 text-left">
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Order Number</p>
                <p className="text-lg font-semibold text-foreground">ORD-XXXXXXXXXXXXX</p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="text-lg font-semibold text-foreground">Pending</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">What's Next?</p>
                <p className="text-foreground">
                  You will receive an email confirmation shortly with tracking information and order details.
                </p>
              </div>
            </div>
          </Card>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/shop">
              <Button variant="outline">
                Continue Shopping
              </Button>
            </Link>
            <Link href="/">
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                Back to Home
              </Button>
            </Link>
          </div>

          <p className="text-sm text-muted-foreground mt-8">
            Questions? Contact us at support@hudhudstones.com or check our FAQ page.
          </p>
        </div>
      </div>
    </div>
  );
}
