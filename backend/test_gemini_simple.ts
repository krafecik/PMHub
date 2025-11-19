import { GoogleGenerativeAI } from '@google/generative-ai';

async function test() {
  const genAI = new GoogleGenerativeAI('AIzaSyANBDu5r6O4ZcYKQt0F0LqyJGbySBu6wzo');
  const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

  try {
    const result = await model.generateContent('Hello');
    console.log(result.response.text());
  } catch (e) {
    console.error(e);
  }
}

test();

