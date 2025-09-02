import { NextRequest, NextResponse } from "next/server";

export const GET = async (request: NextRequest) => {
  try {
    // Get the URL from the query parameter
    const url = request.nextUrl.searchParams.get("url");
    
    if (!url) {
      return NextResponse.json(
        { error: "URL parameter is required" },
        { status: 400 }
      );
    }

    // Fetch the file from the external source
    const response = await fetch(url);
    
    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch from source: ${response.status} ${response.statusText}` },
        { status: response.status }
      );
    }

    // Get the file content as an array buffer
    const arrayBuffer = await response.arrayBuffer();
    
    // Get the content type from the response
    const contentType = response.headers.get("content-type") || "application/octet-stream";
    
    // Create a new response with the file content
    const newResponse = new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": "attachment",
      },
    });

    return newResponse;
  } catch (error) {
    console.error("Proxy download error:", error);
    return NextResponse.json(
      { error: "Failed to proxy download" },
      { status: 500 }
    );
  }
}; 