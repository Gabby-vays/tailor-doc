import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const { jobDescription, apiKey } = await req.json();

        if (!jobDescription || !apiKey) {
            return NextResponse.json({ error: "Missing fields" }, { status: 400 });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        const prompt = `
      You are an expert technical recruiter.
      Job Description:
      ${jobDescription}

      Task: Analyze this job description. Output a JSON object with fields: 
      - title (string)
      - company (string)
      - requirements (array of strings)
      - keywords (array of strings)
      - tone (string)
      - hidden_signals (string)

      Output valid JSON only. Do not use markdown code blocks.
    `;

        const result = await model.generateContent(prompt);
        const text = result.response.text();

        // Clean potential markdown code blocks if the model ignores instruction
        const cleanedText = text.replace(/```json/g, "").replace(/```/g, "").trim();

        return NextResponse.json(JSON.parse(cleanedText));
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Analysis failed" }, { status: 500 });
    }
}
