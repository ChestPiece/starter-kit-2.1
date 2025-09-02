"use server";
import { createClient } from "@/lib/supabase/server";

export const saveFile = async (file: File) => {
  try {
    const supabase = await createClient();
    const bucketName = process.env.NEXT_PUBLIC_SUPABASE_BUCKET_NAME || "uploads";

    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(`public/${Date.now()}.${file.name?.split(".")?.pop()}`, file, {
        upsert: true,
        cacheControl: "3600",
        contentType: file.type,
      });
    
    if (error) {
      console.error("Error uploading file:", error);
      return null;
    }

    const {
      data: { publicUrl },
    } = supabase.storage
      .from(bucketName)
      .getPublicUrl(data?.path || "");

    return publicUrl;
  } catch (error) {
    console.error("Error saving file:", error);
    return null;
  }
};
