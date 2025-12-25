import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { jobDescription, currentResume, profileNotes } = body;

        // Send to n8n Webhook
        // n8n is running locally on port 5678
        // Send to n8n Webhook (Production URL)
        const n8nResponse = await fetch("http://localhost:5678/webhook/generate-resume", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                jobDescription,
                currentResume,
                apiKey: process.env.GEMINI_API_KEY,
                profileNotes
            }),
        });

        if (!n8nResponse.ok) {
            console.error("n8n Webhook Error:", n8nResponse.status, n8nResponse.statusText);
            const errorText = await n8nResponse.text();
            throw new Error(`n8n Workflow failed: ${n8nResponse.statusText} - ${errorText}`);
        }

        const responseText = await n8nResponse.text();
        let data;
        try {
            data = responseText ? JSON.parse(responseText) : {};
        } catch (e) {
            throw new Error(`n8n returned invalid JSON: ${responseText}`);
        }

        if (!data.resumeUrl && !data.coverLetterUrl) {
            console.log("Empty or Missing URLs in n8n Response Data:", data);
            throw new Error("n8n finished but forgot to send the document links back. Did you add the 'Respond to Webhook' node?");
        }

        // The n8n workflow returns { resumeUrl: "...", coverLetterUrl: "..." }
        return NextResponse.json({
            success: true,
            resumeUrl: data.resumeUrl || null,
            coverLetterUrl: data.coverLetterUrl || null
        });

    } catch (error) {
        const errorMessage = (error as Error).message || "Internal Server Error";
        console.error("n8n Proxy Error:", errorMessage);
        return NextResponse.json(
            {
                error: errorMessage,
                details: "Check if n8n is running and the 'Listen for test event' button was clicked."
            },
            { status: 500 }
        );
    }
}
