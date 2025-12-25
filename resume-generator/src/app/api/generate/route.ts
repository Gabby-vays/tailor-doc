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

      Task: Rewrite the Master Resume to perfectly align with the Job Analysis.
      
      IMPORTANT: Output strictly valid JSON (no markdown formatting code blocks). 
      The JSON keys content MUST be PLAIN TEXT (no markdown * or #).
      
      REQUIRED JSON STRUCTURE:
      {
        "NAME": "Your Name",
        "CONTACT_INFO": "Phone | Email | LinkedIn",
        "SUMMARY": "Tailored professional summary...",
        "EXPERIENCE": "• Role 1 (Dates)\\n  - Achievement...\\n  - Achievement...\\n\\n• Role 2...",
        "SKILLS": "Skills: Java, Python, React...",
        "EDUCATION": "Degree, University..."
      }

      Constraint: Keep it concise, 1 page logic.
    `;

        const result = await model.generateContent(prompt);
        const text = result.response.text();

        const cleanedText = text.replace(/```json/g, "").replace(/```/g, "").trim();

        return NextResponse.json(JSON.parse(cleanedText));
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Generation failed" }, { status: 500 });
    }
}
