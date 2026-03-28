/**
 * WhatsApp sharing utilities for Hudhud Stones
 */

export interface WhatsAppShareOptions {
  productName: string;
  productPrice: string;
  productUrl: string;
  message?: string;
}

/**
 * Generate WhatsApp share link for a product
 */
export function generateWhatsAppShareLink(options: WhatsAppShareOptions): string {
  const baseUrl = window.location.origin;
  const fullProductUrl = options.productUrl.startsWith("http")
    ? options.productUrl
    : `${baseUrl}${options.productUrl}`;

  const defaultMessage = `Check out this beautiful ${options.productName} from Hudhud Stones! 💎\n\nPrice: $${options.productPrice}\n\nLink: ${fullProductUrl}`;
  const message = options.message || defaultMessage;

  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/?text=${encodedMessage}`;
}

/**
 * Open WhatsApp share in new window
 */
export function shareOnWhatsApp(options: WhatsAppShareOptions): void {
  const link = generateWhatsAppShareLink(options);
  window.open(link, "_blank", "width=600,height=600");
}

/**
 * Generate WhatsApp share link for web (without phone number)
 */
export function getWhatsAppWebShareUrl(options: WhatsAppShareOptions): string {
  return generateWhatsAppShareLink(options);
}
