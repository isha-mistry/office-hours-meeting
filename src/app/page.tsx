"use client";
import { useRouter } from "next-nprogress-bar";

export default function Home() {
  const router = useRouter();

  const startMeet = async () => {
    const getHeaders = new Headers();
    getHeaders.append("Content-Type", "application/json");

    const res = await fetch(`/api/create-room`, {
      method: "GET",
      headers: getHeaders,
    });
    const result = await res.json();
    const roomId = await result.data;

    router.push(`/meeting/session/${roomId}/lobby`);
  };

  return (
    <div className="h-screen flex items-center justify-center ">
      <button
        onClick={startMeet}
        className="bg-blue-600 py-3 px-6 rounded-full text-xl font-bold"
      >
        Start meeting
      </button>
    </div>
  );
}
