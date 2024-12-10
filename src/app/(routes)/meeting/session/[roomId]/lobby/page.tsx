"use client";

import Image from "next/image";
import React, { useEffect, useState, use } from "react";
import { useRouter } from "next-nprogress-bar";
import { Toaster, toast } from "react-hot-toast";
import { useHuddle01, useRoom, useLocalPeer } from "@huddle01/react/hooks";
// import { useConnectModal } from "@rainbow-me/rainbowkit";
import { Role } from "@huddle01/server-sdk/auth";
import { Oval, RotatingLines } from "react-loader-spinner";
import Link from "next/link";
import { fetchApi } from "@/utils/api";
// import { fetchEnsName } from "@/utils/ENSUtils";
import { useStudioState } from "@/store/studioState";
// import arrow from "@/assets/images/instant-meet/arrow.svg";
import { truncateAddress } from "@/utils/text";
import {
  updateAttendeeStatus,
  updateMeetingStatus,
} from "@/utils/LobbyApiActions";
import { APP_BASE_URL, BASE_URL } from "@/config/constants";
import { useParams } from "next/navigation";

interface PageProps {
  params: {
    roomId: string;
  };
}

const Lobby = () => {
  // State Management
  // const { roomId } = use(params);

  const params = useParams();
  const roomId = params?.roomId as string;

  console.log("roomID::::: ", roomId);

  const [isJoining, setIsJoining] = useState(false);
  const [meetingStatus, setMeetingStatus] = useState<string>();
  const [isAllowToEnter, setIsAllowToEnter] = useState(false);
  const [notAllowedMessage, setNotAllowedMessage] = useState<string>();
  const [profileDetails, setProfileDetails] = useState<any>();
  const [meetingData, setMeetingData] = useState<any>();
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

  // Meeting Details State
  const [hostAddress, setHostAddress] = useState<string>();
  const [daoName, setDaoName] = useState<string>();
  const [sessionType, setSessionType] = useState<string>();
  const [attendeeAddress, setAttendeeAddress] = useState<string>();
  const [hostJoinedStatus, setHostJoinedStatus] = useState<string>();
  const [attendeeJoinedStatus, setAttendeeJoinedStatus] = useState<string>();
  const [isApiCalling, setIsApiCalling] = useState<boolean>();

  // Hooks
  const { push } = useRouter();
  // const { openConnectModal } = useConnectModal();

  const { state, joinRoom } = useRoom();
  const { name, setName, avatarUrl, setAvatarUrl } = useStudioState();

  // Connection Management
  // useEffect(() => {
  //   if (
  //     !isConnected &&
  //     openConnectModal &&
  //     !isPageLoading &&
  //     !isSessionLoading
  //   ) {
  //     openConnectModal();
  //   }
  // }, [isConnected, isPageLoading, isSessionLoading]);

  // Verify Meeting ID

  // Fetch Profile Details

  // Handle Room State Change
  useEffect(() => {
    if (state === "connected") {
      push(`/meeting/session/${roomId}`);
    }
  }, [state]);

  const handleStartSpaces = async () => {
    try {
      setIsJoining(true);

      // Get room token
      const tokenResponse = await fetch("/api/new-token", {
        method: "POST",

        body: JSON.stringify({
          roomId: roomId,
          displayName: name,
        }),
      });

      const result = await tokenResponse.json();
      const token = result.token;
      // Join room
      console.log("roomId: ", roomId);
      console.log("token: ", token);

      await joinRoom({
        roomId: roomId,
        token,
      });

      // Update meeting status

      // Update attendee status if guest
    } catch (error) {
      console.error("Error starting spaces:", error);
      // toast.error("Failed to join meeting");
    } finally {
      setIsJoining(false);
    }
  };

  // Render loading state
  if (isApiCalling) {
    return (
      <div className="flex justify-center items-center h-screen bg-[#0a0a0a]">
        <RotatingLines
          strokeColor="#0356fc"
          strokeWidth="5"
          animationDuration="0.75"
          width="60"
          visible={true}
        />
      </div>
    );
  }

  // Render not allowed message
  if (!isAllowToEnter && notAllowedMessage) {
    return (
      <div className="flex justify-center items-center h-screen bg-[#0a0a0a] text-white">
        <div className="text-center">
          <div className="text-6xl mb-6">☹️</div>
          <div className="text-lg font-semibold mb-8">
            Oops, {notAllowedMessage}
          </div>
          <Link
            href={`${BASE_URL}/meeting/session/${roomId}/lobby`}
            className="px-6 py-3 bg-[#2f2f2f] text-white rounded-full shadow-lg hover:bg-[#202020] transition duration-300"
          >
            Back to Profile
          </Link>
        </div>
      </div>
    );
  }

  // Render main lobby
  return (
    <>
      {/* {isAllowToEnter === true && ( */}
      <div className="min-h-screen bg-[#0a0a0a] ">
        <main className="flex min-h-screen flex-col text-white font-poppins">
          <div className="flex justify-between px-4 md:px-6 lg:px-16 pt-4">
            <div className="text-4xl font-semibold font-quanty tracking-wide">
              <span className="text-white">Chora</span>
              <span className="text-blue-shade-100">Club</span>
            </div>
          </div>

          <div className="flex w-full items-center justify-center my-auto px-4">
            <div className="flex flex-col items-center justify-center gap-4 w-full xs:w-11/12 sm:w-3/4 md:w-2/3 lg:w-1/2 xl:w-1/3 mt-8 lg:mt-14">
              {/* Avatar Section */}
              <div className="relative w-full rounded-2xl py-16 sm:py-20 lg:py-28 overflow-hidden">
                {/* Background blur layer */}
                <div className="absolute inset-0 bg-[#202020] opacity-50 blur-lg z-0"></div>

                {/* Avatar container */}
                <div className="relative z-10 flex items-center justify-center ">
                  <div className="relative rounded-full p-1">
                    <Image
                      src={avatarUrl}
                      alt="profile-avatar"
                      width={100}
                      height={100}
                      className="maskAvatar shadow-md w-20 h-20 xs:w-24 xs:h-24 sm:w-28 sm:h-28 lg:w-32 lg:h-32 rounded-full"
                      quality={100}
                      priority
                    />
                  </div>
                </div>
              </div>

              {/* Name/Address Section */}
              <div className="flex items-center w-full flex-col">
                <div
                  className={`flex flex-col justify-center w-full gap-1 text-white font-semibold`}
                >
                  ENS Name / Address
                  <div
                    className={`flex w-full items-center rounded-[10px]  border border-[#2f2f2f] bg-[#202020] px-3 text-gray-300 outline-none backdrop-blur-[400px]`}
                  >
                    {/* <div 
                    className="absolute inset-0 bg-[#202020] opacity-50 blur-lg z-0"
                  ></div> */}
                    {/* <div className="mr-2">
                      <Image
                        alt="user-icon"
                        src="/images/user-icon.svg"
                        className="size-4 sm:size-5"
                        width={30}
                        height={30}
                      />
                    </div> */}
                    <div className="flex-1 bg-transparent py-2 sm:py-3 outline-none text-gray-500 text-sm sm:text-base">
                      <input
                        value={name}
                        onChange={(e) => {
                          setName(e.target.value);
                        }}
                        onKeyDown={(e) =>
                          e.key === "Enter" && handleStartSpaces()
                        }
                        type="text"
                        placeholder="Enter your name"
                        className="flex-1 bg-transparent py-3 outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Start Button */}
              <div className="flex items-center w-full sm:w-2/3 lg:w-1/2 px-4 sm:px-0">
                <button
                  className={`flex items-center justify-center w-full py-3 sm:py-4 px-4 sm:px-6 mt-4 text-white font-bold text-lg rounded-full transition-all duration-300
                  ${
                    isLoadingProfile
                      ? "bg-gray-700"
                      : "bg-gradient-to-r from-blue-800 to-blue-600 hover:from-blue-900 hover:to-blue-700"
                  }
                  ${
                    isLoadingProfile || isJoining
                      ? "cursor-not-allowed"
                      : "cursor-pointer"
                  }
                  transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50`}
                  onClick={handleStartSpaces}
                  disabled={isLoadingProfile || isJoining}
                >
                  <span className="mr-2">
                    {isJoining ? "Joining Spaces..." : "Start Meeting"}
                  </span>
                  {/* {!isJoining && (
                      <Image
                        alt="arrow-right"
                        width={24}
                        height={24}
                        src={arrow}
                        className="w-5 h-5 sm:w-6 sm:h-6 transition-transform duration-300 group-hover:translate-x-1"
                      />
                    )} */}
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
      {/* )} */}
    </>
  );
};

export default Lobby;
