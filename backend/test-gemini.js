import dotenv from 'dotenv';
import OpenAI from 'openai';

dotenv.config();

async function testNvidiaAI() {
  try {
    const client = new OpenAI({
      apiKey: process.env.NVIDIA_API_KEY,
      baseURL: "https://integrate.api.nvidia.com/v1",
    });

    const completion = await client.chat.completions.create({
      model: "meta/llama-3.1-70b-instruct",
      messages: [{ role: "user", content: "Hello, world!" }],
      temperature: 0.2,
      max_tokens: 100,
    });

    console.log("SUCCESS:", completion.choices[0].message.content);
  } catch (error) {
    console.error("ERROR:", error.message || error);
  }
}

testNvidiaAI();
