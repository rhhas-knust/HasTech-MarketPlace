/** Click-to-chat link -- no WhatsApp Business API integration needed. */
export function whatsappLink(phoneNumber: string, message?: string): string {
  const digits = phoneNumber.replace(/[^0-9]/g, "");
  // Ghanaian local numbers (0XXXXXXXXX) -> international (233XXXXXXXXX).
  const normalized = digits.startsWith("0") ? `233${digits.slice(1)}` : digits;
  const base = `https://wa.me/${normalized}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}
