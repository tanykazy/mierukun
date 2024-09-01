import { Injectable } from '@angular/core';

import { TextPart, InlineDataPart } from '@google-cloud/vertexai';


@Injectable({
  providedIn: 'root'
})
export class GeminiService {
  constructor() { }

  public generateContent(textPart: TextPart, audioPart: InlineDataPart): Promise<any> {
    const result = fetch('/gemini', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          role: 'user',
          parts: [
            textPart,
            audioPart
          ]
        }]
      })
    });

    console.log(result);
    return result.then(res => res.json());
  }

  // Converts a Blob object to a GoogleGenerativeAI.Part object.
  public async blobToGenerativePart(blob: Blob, mimeType: string): Promise<InlineDataPart> {
    console.log('Blob size:');
    console.log(blob.size);

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
