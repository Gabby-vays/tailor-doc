import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const { analysis, currentResume, apiKey } = await req.json();

        if (!analysis || !currentResume || !apiKey) {
            return NextResponse.json({ error: "Missing fields" }, { status: 400 });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        const prompt = `
      You are a professional resume writer.
      
      Job Analysis: ${JSON.stringify(analysis)}
      
      Master Resume:
      ${currentResume}

      Task: Write a professional cover letter for this position.
      
      Guidelines:
      - Use standard business letter format.
      - Hook the reader in the first paragraph.
      - Show why you are a fit based on the resume skills and job requirements.
      - Keep it under 400 words.
      - Output plain text only (no markdown).
      - Do not include placeholders like "[Your Name]" -> use variables or keep it generic enough to fill easily.
    `;

        const result = await model.generateContent(prompt);
        const text = result.response.text();

        return NextResponse.json({ coverLetter: text });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Cover Letter Generation failed" }, { status: 500 });
    }
}
