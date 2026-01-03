import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, title, style, customPrompt, isVertical, userPhotoUrl } = await req.json();
    
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

    // Build the prompt based on whether user photo is provided
    const photoInstructions = userPhotoUrl 
      ? `IMPORTANT: The attached photo MUST be used as the person's photo on the ID card. Place this photo in the designated photo area of the card. Keep the face clearly visible and well-integrated into the card design.`
      : `Include a placeholder for a photo (a stylized silhouette or avatar area)`;

    const prompt = `Generate a high-quality ${orientation} identity card design image.
    
Card Details:
- Name: ${name || "John Doe"}
- Title/Role: ${title || "Professional"}
- Aspect ratio: ${aspectRatio}

Design Style: ${styleDescription}

The card should include:
1. ${photoInstructions}
2. Name prominently displayed
3. Title/role text
4. A unique ID number area
5. A gold/metallic chip element (like credit cards)
6. Company/organization logo placeholder
7. Professional layout with clear hierarchy

${customPrompt ? `Additional requirements: ${customPrompt}` : ""}

Make it look like a real, premium identity card with depth, shadows, and high production value. The design should be photorealistic and ready for printing.
Ultra high resolution.`;

    console.log("Generating ID card with photo:", !!userPhotoUrl);
    console.log("Prompt preview:", prompt.substring(0, 300) + "...");

    // Build message content - include image if user photo is provided
    let messageContent: any;
    if (userPhotoUrl) {
      messageContent = [
        {
          type: "text",
          text: prompt,
        },
        {
          type: "image_url",
          image_url: {
            url: userPhotoUrl,
          },
        },
      ];
    } else {
      messageContent = prompt;
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
            content: messageContent,
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
    console.log("AI response received");

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
