import { google } from "googleapis";
import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { GET as authOptions } from "../auth/[...nextauth]/route";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        // @ts-ignore
        const accessToken = session?.accessToken;

        if (!accessToken) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { content, templateId, companyName } = await req.json();

        const auth = new google.auth.OAuth2();
        auth.setCredentials({ access_token: accessToken });

        const drive = google.drive({ version: "v3", auth });
        const docs = google.docs({ version: "v1", auth });

        // 1. Copy Template
        const copyResponse = await drive.files.copy({
            fileId: templateId,
            requestBody: {
                name: `Resume - ${companyName || "Tailored"}`,
            },
        });

        const newDocId = copyResponse.data.id;
        if (!newDocId) throw new Error("Failed to copy file");

        // 2. Prepare Requests
        const requests = [
            { replaceAllText: { containsText: { text: "{{NAME}}", matchCase: true }, replaceText: content.NAME || "" } },
            { replaceAllText: { containsText: { text: "{{CONTACT_INFO}}", matchCase: true }, replaceText: content.CONTACT_INFO || "" } },
            { replaceAllText: { containsText: { text: "{{SUMMARY}}", matchCase: true }, replaceText: content.SUMMARY || "" } },
            { replaceAllText: { containsText: { text: "{{EXPERIENCE}}", matchCase: true }, replaceText: content.EXPERIENCE || "" } },
            { replaceAllText: { containsText: { text: "{{SKILLS}}", matchCase: true }, replaceText: content.SKILLS || "" } },
            { replaceAllText: { containsText: { text: "{{EDUCATION}}", matchCase: true }, replaceText: content.EDUCATION || "" } },
        ];

        // 3. Update Doc
        await docs.documents.batchUpdate({
            documentId: newDocId,
            requestBody: {
                requests,
            },
        });

        return NextResponse.json({
            success: true,
            docId: newDocId,
            url: `https://docs.google.com/document/d/${newDocId}/edit`
        });

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Doc creation failed" }, { status: 500 });
    }
}
