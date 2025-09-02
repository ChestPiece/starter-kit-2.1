"use server";
import { supabaseClient } from "@/lib/supabase-auth-client";

export const saveFile = async (file: File) => {
  try {
    const bucketName = process.env.NEXT_PUBLIC_SUPABASE_BUCKET_NAME || "uploads";

    const { data, error } = await supabaseClient.storage
      .from(bucketName)
      .upload(`public/${Date.now()}.${file.name?.split(".")?.pop()}`, file, {
        upsert: true,
        cacheControl: "3600",
        contentType: file.type,
      });
    const {
      data: { publicUrl },
    } = supabaseClient.storage
      .from(bucketName)
      .getPublicUrl(data?.path || "");

    return publicUrl;
  } catch (error) {
    console.error("Error saving file:", error);
    return null;
  }
};
