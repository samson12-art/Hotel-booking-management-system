import multer from "multer";
import path from "path";
import { v4 as uuidv4 } from "uuid";

const storage = (subfolder: string) =>
  multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, path.join("uploads", subfolder));
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `${uuidv4()}${ext}`);
    },
  });

const imageFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed"));
  }
};

const documentFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = [
    "image/jpeg", "image/jpg", "image/png", "image/webp",
    "application/pdf",
  ];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only image or PDF files are allowed"));
  }
};

export const uploadHotelImages = multer({
  storage: storage("hotels"),
  fileFilter: imageFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

export const uploadRoomImages = multer({
  storage: storage("rooms"),
  fileFilter: imageFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

export const uploadProfileImage = multer({
  storage: storage("profiles"),
  fileFilter: imageFilter,
  limits: { fileSize: 2 * 1024 * 1024 },
});

export const uploadReviewImages = multer({
  storage: storage("reviews"),
  fileFilter: imageFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

export const uploadIdDocument = multer({
  storage: storage("ids"),
  fileFilter: documentFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
});

export const uploadReceipt = multer({
  storage: storage("receipts"),
  fileFilter: documentFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
});
