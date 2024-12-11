import { NextRequest, NextResponse } from "next/server";
import { Recorder } from "@huddle01/server-sdk/recorder";

export async function POST(
  req: NextRequest,
  context: {
    params: { id: string };
  }
): Promise<void | Response> {
  const { id: roomId } = context.params;

  if (!process.env.NEXT_PUBLIC_PROJECT_ID || !process.env.NEXT_PUBLIC_API_KEY) {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }

  const recorder = new Recorder(
    process.env.NEXT_PUBLIC_PROJECT_ID,
    process.env.NEXT_PUBLIC_API_KEY
  );

  try {
    const recording = await recorder.stop({ roomId: roomId as string });

    const { msg } = recording;

    if (msg === "Stopped") {
      return NextResponse.json({ success: true }, { status: 200 });
    } else {
      return NextResponse.json({ success: false }, { status: 400 });
    }
  } catch (error) {
    console.error("Error stopping recording:", error);
    return NextResponse.json(
      { error: "Failed to stop recording", success: false },
      { status: 500 }
    );
  }
}
