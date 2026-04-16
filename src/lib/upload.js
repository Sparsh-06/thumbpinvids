import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

export async function uploadFile(file, category = "general") {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  
  const fileExt = file.type.split("/")[1] || "bin";
  const fileName = `${crypto.randomUUID()}.${fileExt}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads", category);
  
  // Ensure directory exists
  await fs.mkdir(uploadDir, { recursive: true });
  
  const filePath = path.join(uploadDir, fileName);
  await fs.writeFile(filePath, buffer);
  
  // Return the public URL
  return `/uploads/${category}/${fileName}`;
}
