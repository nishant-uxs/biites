import { GoogleGenerativeAI } from "@google/generative-ai";

export interface ExtractedDish {
  name: string;
  price: number;
  description?: string;
  category?: string;
  isVeg?: boolean;
  calories?: number;
  protein?: number;
  carbs?: number;
  sugar?: number;
}

export interface MenuExtractionResult {
  dishes: ExtractedDish[];
  error?: string;
}

export class GeminiService {
  private genAI: GoogleGenerativeAI;
  
  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is not set");
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  async extractMenuFromImage(imageUrl: string): Promise<MenuExtractionResult> {
    try {
      const model = this.genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

      const imageResponse = await fetch(imageUrl);
      const imageBuffer = await imageResponse.arrayBuffer();
      const base64Image = Buffer.from(imageBuffer).toString('base64');

      const prompt = `You are a food menu extraction assistant for a campus food ordering app in India. 
      Analyze this menu image and extract ALL dishes with their details in JSON format.

      For each dish, provide:
      - name: Full dish name (string)
      - price: Price in rupees as a number (extract from ₹X or Rs.X format)
      - description: Brief description if visible (string, optional)
      - category: Food category like "Main Course", "Snacks", "Beverages", etc. (string, optional)
      - isVeg: true if vegetarian/veg symbol visible, false otherwise (boolean, optional)
      - calories: Estimated calories if nutrition info visible (number, optional)
      - protein: Estimated protein in grams if visible (number, optional)
      - carbs: Estimated carbs in grams if visible (number, optional)
      - sugar: Estimated sugar in grams if visible (number, optional)

      IMPORTANT RULES:
      1. Extract EVERY dish you can identify from the menu
      2. If price is a range like "₹50-₹80", use the lower value
      3. If no price visible, use 0
      4. Be accurate with prices - double check numbers
      5. Include combos, meals, drinks, snacks - everything visible
      6. If you see veg/non-veg symbols, set isVeg accordingly
      7. Return ONLY valid JSON array, no markdown, no explanation
      
      Return format:
      [
        {
          "name": "Dish Name",
          "price": 50,
          "description": "Brief description",
          "category": "Main Course",
          "isVeg": true,
          "calories": 400,
          "protein": 12,
          "carbs": 45,
          "sugar": 5
        }
      ]`;

      const result = await model.generateContent([
        {
          inlineData: {
            data: base64Image,
            mimeType: imageResponse.headers.get('content-type') || 'image/jpeg'
          }
        },
        { text: prompt }
      ]);

      const response = await result.response;
      const text = response.text();

      let cleanedText = text.trim();
      if (cleanedText.startsWith('```json')) {
        cleanedText = cleanedText.slice(7);
      }
      if (cleanedText.startsWith('```')) {
        cleanedText = cleanedText.slice(3);
      }
      if (cleanedText.endsWith('```')) {
        cleanedText = cleanedText.slice(0, -3);
      }
      cleanedText = cleanedText.trim();

      const dishes = JSON.parse(cleanedText) as ExtractedDish[];

      return {
        dishes: dishes.map(dish => ({
          ...dish,
          price: typeof dish.price === 'number' ? dish.price : parseFloat(String(dish.price)) || 0,
          isVeg: dish.isVeg ?? undefined,
          calories: dish.calories ?? undefined,
          protein: dish.protein ?? undefined,
          carbs: dish.carbs ?? undefined,
          sugar: dish.sugar ?? undefined,
        }))
      };

    } catch (error) {
      console.error('Gemini menu extraction error:', error);
      return {
        dishes: [],
        error: error instanceof Error ? error.message : 'Failed to extract menu from image'
      };
    }
  }
}
