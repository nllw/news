import { NextRequest, NextResponse } from "next/server";
import { getAllArticles, createArticle } from "@/lib/db";
import { isAuthenticated } from "@/lib/auth";

export async function GET() {
  const articles = getAllArticles();
  return NextResponse.json(articles);
}

export async function POST(req: NextRequest) {
  if (!isAuthenticated()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const input = await req.json();
  const article = createArticle(input);
  return NextResponse.json(article, { status: 201 });
}
