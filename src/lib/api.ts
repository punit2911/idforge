import { supabase } from "@/integrations/supabase/client";

interface GenerateCardParams {
  name: string;
  title: string;
  style: string;
  customPrompt?: string;
  isVertical?: boolean;
}

interface GenerateCardResult {
  success: boolean;
  imageUrl?: string;
  message?: string;
  error?: string;
}

export async function generateIDCard(params: GenerateCardParams): Promise<GenerateCardResult> {
  try {
    const { data, error } = await supabase.functions.invoke<GenerateCardResult>("generate-id-card", {
      body: params,
    });

    if (error) {
      console.error("Error calling generate-id-card:", error);
      return { success: false, error: error.message };
    }

    return data || { success: false, error: "No response from server" };
  } catch (err) {
    console.error("Failed to generate ID card:", err);
    return { 
      success: false, 
      error: err instanceof Error ? err.message : "Failed to generate ID card" 
    };
  }
}

export async function saveDesign(params: {
  userId: string;
  name: string;
  title?: string;
  style: string;
  isVertical: boolean;
  imageUrl?: string;
  customPrompt?: string;
  isPublic?: boolean;
}) {
  const { data, error } = await supabase
    .from("saved_designs")
    .insert({
      user_id: params.userId,
      name: params.name,
      title: params.title,
      style: params.style,
      is_vertical: params.isVertical,
      image_url: params.imageUrl,
      custom_prompt: params.customPrompt,
      is_public: params.isPublic ?? false,
    })
    .select()
    .single();

  return { data, error };
}

export async function getUserDesigns(userId: string) {
  const { data, error } = await supabase
    .from("saved_designs")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  return { data, error };
}

export async function getPublicDesigns(limit = 20) {
  const { data, error } = await supabase
    .from("saved_designs")
    .select("*")
    .eq("is_public", true)
    .order("created_at", { ascending: false })
    .limit(limit);

  return { data, error };
}

export async function toggleFavorite(designId: string, isFavorite: boolean) {
  const { data, error } = await supabase
    .from("saved_designs")
    .update({ is_favorite: isFavorite })
    .eq("id", designId)
    .select()
    .single();

  return { data, error };
}

export async function deleteDesign(designId: string) {
  const { error } = await supabase
    .from("saved_designs")
    .delete()
    .eq("id", designId);

  return { error };
}
