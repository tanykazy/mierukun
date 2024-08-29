import { Injectable } from '@angular/core';

import { GoogleGenerativeAI, GenerativeModel, TextPart, InlineDataPart } from '@google/generative-ai';


@Injectable({
  providedIn: 'root'
})
export class GeminiService {
  constructor() { }

  private generativeAI!: GoogleGenerativeAI;
  private generativeModel!: GenerativeModel;

  public initializeModel(apikey: string) {
    this.generativeAI = new GoogleGenerativeAI(apikey);
    this.generativeModel = this.generativeAI.getGenerativeModel({
      model: 'gemini-1.5-pro'
    });
  }

  public generateContent(textPart: TextPart, audioPart: InlineDataPart): Promise<any> {
    if (!this.generativeAI || !this.generativeModel) {
      throw new Error('モデルが初期化されていません');
    }

    const result = this.generativeModel.generateContent([
      textPart,
      audioPart
    ]);

    return result.then(res => res.response);
  }

  // Converts a Blob object to a GoogleGenerativeAI.Part object.
  public async blobToGenerativePart(blob: Blob, mimeType: string): Promise<InlineDataPart> {
    const base64EncodedDataPromise = new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
      reader.readAsDataURL(blob);
    });
    return {
      inlineData: {
        data: await base64EncodedDataPromise,
        mimeType: mimeType
      }
    };
  }
}
