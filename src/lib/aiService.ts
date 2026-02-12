
import { OpenAI } from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';

export interface GenerateDescriptionParams {
  productName: string;
  features: string[];
  tone?: 'professional' | 'creative' | 'friendly' | 'luxury';
  language?: 'fa' | 'en'; // Default to 'fa'
}

export interface AIProvider {
  generateProductDescription(params: GenerateDescriptionParams): Promise<string>;
}

// Mock Provider for testing/development without costs
class MockAIProvider implements AIProvider {
  async generateProductDescription(params: GenerateDescriptionParams): Promise<string> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    const featuresList = params.features.map(f => `<li>${f}</li>`).join('');
    
    return `
      <div dir="rtl">
        <h2>معرفی محصول ${params.productName}</h2>
        <p>این یک توضیحات تولید شده توسط هوش مصنوعی (نسخه آزمایشی) برای محصول <strong>${params.productName}</strong> است.</p>
        <p>این محصول با ویژگی‌های منحصر به فرد خود، انتخابی عالی برای شماست. طراحی زیبا و کیفیت ساخت بالا از مشخصات بارز این کالا می‌باشد.</p>
        
        <h3>ویژگی‌های کلیدی:</h3>
        <ul>
          ${featuresList}
        </ul>
        
        <p>با خرید این محصول، تجربه‌ای متفاوت را احساس خواهید کرد. همین حالا سفارش دهید!</p>
      </div>
    `;
  }
}

// OpenAI Provider
class OpenAIProvider implements AIProvider {
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({
      apiKey: apiKey,
      dangerouslyAllowBrowser: false, // Only runs on server
    });
  }

  async generateProductDescription(params: GenerateDescriptionParams): Promise<string> {
    const { productName, features, tone = 'professional', language = 'fa' } = params;
    
    const prompt = `
      You are an expert product copywriter. Write a compelling, SEO-friendly product description in ${language === 'fa' ? 'Persian (Farsi)' : 'English'} for a product named "${productName}".
      
      Key features to highlight:
      ${features.map(f => `- ${f}`).join('\n')}
      
      Tone: ${tone}
      Format: HTML (use h2, h3, p, ul, li tags). Do not include markdown code blocks (like \`\`\`html), just return the raw HTML string.
      Target Audience: General consumers.
      
      Structure:
      1. Catchy Title (H2)
      2. Engaging Introduction (P)
      3. Detailed Feature Analysis (H3 + UL/LI + P)
      4. Call to Action (P)
      
      Ensure the content is persuasive and naturally includes relevant keywords.
    `;

    try {
      const response = await this.client.chat.completions.create({
        model: 'gpt-4o-mini', // Or gpt-3.5-turbo / gpt-4
        messages: [
          { role: 'system', content: 'You are a helpful assistant that generates HTML product descriptions.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
      });

      let content = response.choices[0]?.message?.content || '';
      
      // Cleanup markdown code blocks if present
      content = content.replace(/^```html\s*/, '').replace(/\s*```$/, '');
      
      return content;
    } catch (error) {
      console.error('OpenAI API Error:', error);
      throw new Error('Failed to generate description via OpenAI');
    }
  }
}

// Gemini Provider
class GeminiProvider implements AIProvider {
  private genAI: GoogleGenerativeAI;

  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  async generateProductDescription(params: GenerateDescriptionParams): Promise<string> {
    const { productName, features, tone = 'professional', language = 'fa' } = params;
    
    const prompt = `
      You are an expert product copywriter. Write a compelling, SEO-friendly product description in ${language === 'fa' ? 'Persian (Farsi)' : 'English'} for a product named "${productName}".
      
      Key features to highlight:
      ${features.map(f => `- ${f}`).join('\n')}
      
      Tone: ${tone}
      Format: HTML (use h2, h3, p, ul, li tags). Do not include markdown code blocks (like \`\`\`html), just return the raw HTML string.
      Target Audience: General consumers.
      
      Structure:
      1. Catchy Title (H2)
      2. Engaging Introduction (P)
      3. Detailed Feature Analysis (H3 + UL/LI + P)
      4. Call to Action (P)
      
      Ensure the content is persuasive and naturally includes relevant keywords.
    `;

    try {
      // Use gemini-1.5-flash for speed and cost-efficiency
      const model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      let content = response.text();
      
      // Cleanup markdown code blocks if present
      content = content.replace(/^```html\s*/, '').replace(/\s*```$/, '');
      
      return content;
    } catch (error) {
      console.error('Gemini API Error:', error);
      throw new Error('Failed to generate description via Gemini');
    }
  }
}

// Factory to get the appropriate provider
export class AIService {
  private static instance: AIProvider;

  static getProvider(): AIProvider {
    // Note: We re-check env vars or allow re-instantiation if needed in a more complex setup,
    // but for now singleton is fine. If env vars change at runtime, restart is needed.
    if (this.instance) return this.instance;

    const providerType = process.env.AI_PROVIDER || 'mock'; 
    
    if (providerType === 'openai') {
      const apiKey = process.env.OPENAI_API_KEY;
      if (apiKey) {
        this.instance = new OpenAIProvider(apiKey);
      } else {
        console.warn('AI_PROVIDER is openai but OPENAI_API_KEY is missing. Falling back to mock.');
        this.instance = new MockAIProvider();
      }
    } else if (providerType === 'gemini') {
      const apiKey = process.env.GOOGLE_API_KEY;
      if (apiKey) {
        this.instance = new GeminiProvider(apiKey);
      } else {
        console.warn('AI_PROVIDER is gemini but GOOGLE_API_KEY is missing. Falling back to mock.');
        this.instance = new MockAIProvider();
      }
    } else {
      this.instance = new MockAIProvider();
    }

    return this.instance;
  }
}
