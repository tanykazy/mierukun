import { Injectable } from '@angular/core';

enum HarmCategory {
  HARM_CATEGORY_UNSPECIFIED = 'HARM_CATEGORY_UNSPECIFIED', // カテゴリが指定されていません。
  HARM_CATEGORY_DEROGATORY = 'HARM_CATEGORY_DEROGATORY', // ID や保護されている属性をターゲットとする否定的なコメントや有害なコメント。
  HARM_CATEGORY_TOXICITY = 'HARM_CATEGORY_TOXICITY', // 粗暴、無礼、または冒とく的なコンテンツ。
  HARM_CATEGORY_VIOLENCE = 'HARM_CATEGORY_VIOLENCE', // 個人やグループに対する暴力を描写したシナリオ、または残虐行為の一般的な説明についての記述。
  HARM_CATEGORY_SEXUAL = 'HARM_CATEGORY_SEXUAL', // 性行為やわいせつな内容に関する情報が含まれるコンテンツ。
  HARM_CATEGORY_MEDICAL = 'HARM_CATEGORY_MEDICAL', // 事実に即した医学的なアドバイスをすすめています。
  HARM_CATEGORY_DANGEROUS = 'HARM_CATEGORY_DANGEROUS', // 有害な行為を助長、促進、または助長する危険なコンテンツ。
  HARM_CATEGORY_HARASSMENT = 'HARM_CATEGORY_HARASSMENT', // ハラスメント コンテンツ。
  HARM_CATEGORY_HATE_SPEECH = 'HARM_CATEGORY_HATE_SPEECH', // 悪意のある表現やコンテンツ。
  HARM_CATEGORY_SEXUALLY_EXPLICIT = 'HARM_CATEGORY_SEXUALLY_EXPLICIT', // 性的描写が露骨なコンテンツ。
  HARM_CATEGORY_DANGEROUS_CONTENT = 'HARM_CATEGORY_DANGEROUS_CONTENT', // 危険なコンテンツ。
};

enum HarmBlockThreshold {
  HARM_BLOCK_THRESHOLD_UNSPECIFIED = 'HARM_BLOCK_THRESHOLD_UNSPECIFIED', // しきい値が指定されていません。
  BLOCK_LOW_AND_ABOVE = 'BLOCK_LOW_AND_ABOVE', // NEGLIGIBLE を含むコンテンツは許可されます。
  BLOCK_MEDIUM_AND_ABOVE = 'BLOCK_MEDIUM_AND_ABOVE', // NEGLIGIBLE と LOW のコンテンツは許可されます。
  BLOCK_ONLY_HIGH = 'BLOCK_ONLY_HIGH', // NEGLIGIBLE、LOW、MEDIUM のコンテンツは許可されます。
  BLOCK_NONE = 'BLOCK_NONE', // すべてのコンテンツが許可されます。
};

@Injectable({
  providedIn: 'root'
})
export class GeminiService {

  constructor() { }

  private readonly rest = {
    modelCode: 'gemini-1.5-pro',
    geminiApi: 'https://generativelanguage.googleapis.com/v1/models',
    generateContent: 'generateContent'
  };

  // private readonly safetySettings = [{
  //   category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
  //   threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH
  // }];

  generateContent(apikey: string, parts: Array<object>) {
    // console.log(parts);
    // console.log(JSON.stringify({
    //   contents: [{
    //     role: 'user',
    //     parts: parts
    //   }]
    // }));

    // console.log(JSON.stringify({
    //   contents: [{
    //     role: 'user',
    //     parts: parts
    //   }],
    //   safetySettings: this.safetySettings,
    // }));

    const url = `${this.rest.geminiApi}/${this.rest.modelCode}:${this.rest.generateContent}?key=${apikey}`;
    const response = fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      mode: 'cors',
      body: JSON.stringify({
        contents: [{
          role: 'user',
          parts: parts
        }],
        safetySettings: [{
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH
        }],
      })
    });

    // console.log(response);
    return response.then(response => response.json());
  }

  // Converts a Blob object to a GoogleGenerativeAI.Part object.
  static async blobToGenerativePart(blob: Blob, mimeType: string) {
    const base64EncodedDataPromise = new Promise((resolve) => {
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
