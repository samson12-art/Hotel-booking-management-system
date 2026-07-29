import { v4 as uuidv4 } from "uuid";

export const generateBookingNumber = (): string => {
  const prefix = "HB";
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = uuidv4().slice(0, 4).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
};

export const generateInvoiceNumber = (): string => {
  const prefix = "INV";
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = uuidv4().slice(0, 4).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
};

export const calculateNights = (checkIn: Date, checkOut: Date): number => {
  const diffTime = Math.abs(checkOut.getTime() - checkIn.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
};

export const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^\w ]+/g, "")
    .replace(/ +/g, "-");
};
