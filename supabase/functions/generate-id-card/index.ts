import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const VALID_STYLES = ["corporate", "student", "futuristic", "minimal", "creative"];

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate user
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      console.log("Authentication failed:", authError?.message);
      return new Response(
        JSON.stringify({ error: "Unauthorized. Please sign in to generate ID cards." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Authenticated user:", user.id);

    const { name, title, style, customPrompt, isVertical, userPhotoUrl, logoUrl } = await req.json();

    // Input validation
    if (!name || typeof name !== "string") {
      return new Response(
        JSON.stringify({ error: "Name is required and must be a string." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (name.length > 100) {
      return new Response(
        JSON.stringify({ error: "Name too long. Maximum 100 characters allowed." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (title && typeof title !== "string") {
      return new Response(
        JSON.stringify({ error: "Title must be a string." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (title && title.length > 200) {
      return new Response(
        JSON.stringify({ error: "Title too long. Maximum 200 characters allowed." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (customPrompt && typeof customPrompt !== "string") {
      return new Response(
        JSON.stringify({ error: "Custom prompt must be a string." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (customPrompt && customPrompt.length > 500) {
      return new Response(
        JSON.stringify({ error: "Custom prompt too long. Maximum 500 characters allowed." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (style && !VALID_STYLES.includes(style)) {
      return new Response(
        JSON.stringify({ error: `Invalid style. Must be one of: ${VALID_STYLES.join(", ")}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (userPhotoUrl && typeof userPhotoUrl !== "string") {
      return new Response(
        JSON.stringify({ error: "User photo URL must be a string." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (logoUrl && typeof logoUrl !== "string") {
      return new Response(
        JSON.stringify({ error: "Logo URL must be a string." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate URL format if provided
    if (userPhotoUrl && !userPhotoUrl.startsWith("data:")) {
      try {
        new URL(userPhotoUrl);
      } catch {
        return new Response(
          JSON.stringify({ error: "Invalid user photo URL format." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    if (logoUrl && !logoUrl.startsWith("data:")) {
      try {
        new URL(logoUrl);
      } catch {
        return new Response(
          JSON.stringify({ error: "Invalid logo URL format." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build the AI prompt for generating an ID card design
    const orientation = isVertical ? "vertical (portrait)" : "horizontal (landscape)";
    const aspectRatio = isVertical ? "1:1.586" : "1.586:1";
    
    let styleDescription = "";
    switch (style) {
      case "corporate":
        styleDescription = "professional corporate design with navy blue and silver colors, clean lines, modern business aesthetic";
        break;
      case "student":
        styleDescription = "vibrant student ID design with school colors (blue and gold), academic symbols, youthful and energetic";
        break;
      case "futuristic":
        styleDescription = "sci-fi futuristic design with neon cyan and purple gradients, holographic effects, circuit patterns, sleek tech aesthetic";
        break;
      case "minimal":
        styleDescription = "clean minimal design with white/light gray background, simple black typography, elegant and understated";
        break;
      case "creative":
        styleDescription = "bold creative design with vibrant gradient colors (pink, orange, yellow), artistic elements, modern and playful";
        break;
      default:
        styleDescription = "modern professional identity card design";
    }

    // Build the prompt based on whether user photo and/or logo is provided
    const photoInstructions = userPhotoUrl 
      ? `IMPORTANT: The first attached photo is the person's photo and MUST be used on the ID card. Place this photo in the designated photo area of the card. Keep the face clearly visible and well-integrated into the card design.`
      : `Include a placeholder for a photo (a stylized silhouette or avatar area)`;

    const logoInstructions = logoUrl
      ? `IMPORTANT: The ${userPhotoUrl ? "second" : "first"} attached image is the company/school/organization logo. This logo MUST be prominently displayed on the ID card, typically in the top corner or header area. Integrate it naturally into the card design while keeping it clearly visible.`
      : `Include a placeholder for a company/organization logo`;

    const prompt = `Generate a high-quality ${orientation} identity card design image.
    
Card Details:
- Name: ${name || "John Doe"}
- Title/Role: ${title || "Professional"}
- Aspect ratio: ${aspectRatio}

Design Style: ${styleDescription}

The card should include:
1. ${photoInstructions}
2. ${logoInstructions}
3. Name prominently displayed
4. Title/role text
5. A unique ID number area
6. A gold/metallic chip element (like credit cards)
7. Professional layout with clear hierarchy

${customPrompt ? `Additional requirements: ${customPrompt}` : ""}

Make it look like a real, premium identity card with depth, shadows, and high production value. The design should be photorealistic and ready for printing.
Ultra high resolution.`;

    console.log("Generating ID card for user:", user.id, "with photo:", !!userPhotoUrl, "with logo:", !!logoUrl);

    // Build message content - include images if provided
    const messageContent: any[] = [
      {
        type: "text",
        text: prompt,
      },
    ];

    // Add user photo if provided
    if (userPhotoUrl) {
      messageContent.push({
        type: "image_url",
        image_url: {
          url: userPhotoUrl,
        },
      });
    }

    // Add logo if provided
    if (logoUrl) {
      messageContent.push({
        type: "image_url",
        image_url: {
          url: logoUrl,
        },
      });
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image-preview",
        messages: [
          {
            role: "user",
            content: messageContent.length === 1 ? messageContent[0].text : messageContent,
          },
        ],
        modalities: ["image", "text"],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Usage limit reached. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    console.log("AI response received for user:", user.id);

    // Extract the generated image
    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    const textContent = data.choices?.[0]?.message?.content;

    if (!imageUrl) {
      console.error("No image in response:", JSON.stringify(data).substring(0, 500));
      throw new Error("No image generated");
    }

    return new Response(
      JSON.stringify({
        success: true,
        imageUrl,
        message: textContent || "ID card generated successfully",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error generating ID card:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Failed to generate ID card" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
