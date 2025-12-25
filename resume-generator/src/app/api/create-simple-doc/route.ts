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

        const { content, title } = await req.json();

        const auth = new google.auth.OAuth2();
        auth.setCredentials({ access_token: accessToken });
        const docs = google.docs({ version: "v1", auth });

        // 1. Create Blank Doc
        const createResponse = await docs.documents.create({
            requestBody: {
                title: title || "New Document",
            },
        });

        const docId = createResponse.data.documentId;
        if (!docId) throw new Error("Failed to create file");

        // 2. Insert Content
        await docs.documents.batchUpdate({
            documentId: docId,
            requestBody: {
                requests: [
                    {
                        insertText: {
                            location: { index: 1 },
                            text: content,
                        },
                    },
                ],
            },
        });

        return NextResponse.json({
            success: true,
            docId: docId,
            url: `https://docs.google.com/document/d/${docId}/edit`
        });

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Doc creation failed" }, { status: 500 });
    }
}
