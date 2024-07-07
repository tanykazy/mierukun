import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class GeminiService {

  constructor() { }

  readonly rest = {
    modelCode: 'gemini-1.5-pro-latest',
    geminiApi: 'https://generativelanguage.googleapis.com/v1beta',
    generateContent: 'generateContent'
  };

  generateContent(apikey: string, parts: Array<object>) {
    const url = `${this.rest.geminiApi}${this.rest.modelCode}:${this.rest.generateContent}?key=${apikey}`;
    const response = fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({

        contents: [{
          role: 'user',
          parts: [{
            text: '学習について教えてください。'
          }]
        }]
      })
    });

    return response.then(response => response.json());
  }
}
