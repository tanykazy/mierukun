import { Injectable } from '@angular/core';

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

  generateContent(apikey: string, parts: Array<object>) {
    console.log(parts);
    console.log(JSON.stringify({
      contents: [{
        role: 'user',
        parts: parts
      }]
    }));

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
        }]
      })
    });

    console.log(response);
    return response.then(response => response.json());
  }
}
