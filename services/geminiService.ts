import { GoogleGenAI, Type, Schema } from "@google/genai";
import { Character } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const CHARACTERS_COUNT = 10; // 10 pairs = 20 cards

// Specific requested characters + fillers to reach 10
const FALLBACK_CHARACTERS: Character[] = [
    { name: "Captain Underpants", source: "Captain Underpants", description: "3D render of Captain Underpants, bald, wearing white underwear and red cape, smiling widely" },
    { name: "Little Bheem", source: "Mighty Little Bheem", description: "Cute 3D baby warrior Little Bheem, wearing an orange dhoti, eating a laddu" },
    { name: "Sonic", source: "Sonic the Hedgehog", description: "Cute 3D Sonic the Hedgehog, blue fur, red shoes, giving a thumbs up" },
    { name: "Super Mario", source: "Super Mario Bros", description: "Cute 3D Super Mario, red cap, blue overalls, mustache, jumping" },
    { name: "Luigi", source: "Super Mario Bros", description: "Cute 3D Luigi, green cap, blue overalls, taller and nervous smile" },
    { name: "JJ", source: "Cocomelon", description: "Cute 3D baby JJ from Cocomelon, blonde curl, pajamas, smiling" },
    { name: "Pikachu", source: "Pokemon", description: "Cute 3D Pikachu, yellow fur, red cheeks, lightning tail, happy" },
    { name: "SpongeBob", source: "SpongeBob SquarePants", description: "Cute 3D SpongeBob, yellow sponge, square pants, big blue eyes, laughing" },
    { name: "Elsa", source: "Frozen", description: "Cute 3D Queen Elsa, blue ice dress, platinum blonde braid, magical snowflake" },
    { name: "Chase", source: "Paw Patrol", description: "Cute 3D Chase the police dog German Shepherd, blue police uniform and hat" },
];

export const fetchCharacters = async (): Promise<Character[]> => {
  try {
    const schema: Schema = {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: "Name of the character" },
          source: { type: Type.STRING, description: "Show or Game they are from" },
          description: { type: Type.STRING, description: "Visual description for a cute 3D toy style image" }
        },
        required: ["name", "source", "description"],
      },
    };

    // We ask Gemini to prioritize the user's list but return 10 total.
    const prompt = `List exactly ${CHARACTERS_COUNT} iconic children's characters. 
    MUST INCLUDE: Captain Underpants, Little Bheem, Sonic, Super Mario, Luigi, JJ (Cocomelon). 
    Add other very popular kids characters to reach 10.
    Return JSON.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview", 
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    });

    if (response.text) {
      return JSON.parse(response.text) as Character[];
    }
    console.warn("Gemini returned empty text, using fallback.");
    return FALLBACK_CHARACTERS;
  } catch (error) {
    console.error("Error fetching characters, using fallback:", error);
    return FALLBACK_CHARACTERS;
  }
};

export const generateCharacterImage = async (char: Character): Promise<string> => {
  try {
    // Prompt optimized for cute, kid-friendly, consistent style
    const prompt = `A cute, high-quality, glossy 3D toy-style render of ${char.name} from ${char.source}. ${char.description}. Bright vibrant colors, soft lighting, solid simple pastel background. Pixar style.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: prompt,
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No image data found");
  } catch (error) {
    console.warn(`Failed to generate image for ${char.name}.`, error);
    // Fallback placeholder
    return `https://via.placeholder.com/400x400/FFB6C1/000000?text=${encodeURIComponent(char.name)}`;
  }
};
