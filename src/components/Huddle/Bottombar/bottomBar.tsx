"use client";
import {
  useDataMessage,
  useLocalAudio,
  useLocalPeer,
  useLocalScreenShare,
  useLocalVideo,
  usePeerIds,
  useRoom,
} from "@huddle01/react/hooks";
import { Button } from "@/components/ui/button";
import { BasicIcons } from "@/utils/BasicIcons";
import { useStudioState } from "@/store/studioState";
import ButtonWithIcon from "../../ui/buttonWithIcon";
import { Role } from "@huddle01/server-sdk/auth";
import { PeerMetadata } from "@/utils/types";
import clsx from "clsx";
import toast from "react-hot-toast";
import Dropdown from "../../ui/Dropdown";
import Strip from "../sidebars/participantsSidebar/Peers/PeerRole/Strip";
import { useEffect, useState } from "react";
import { useParams, usePathname } from "next/navigation";
import { useAccount } from "wagmi";
import { useWalletAddress } from "@/app/hooks/useWalletAddress";
import { getAccessToken } from "@privy-io/react-auth";
import { PiLinkSimpleBold } from "react-icons/pi";
import { opBlock, arbBlock } from "@/config/staticDataUtils";
import ReactionBar from "../ReactionBar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "../../ui/dropdown-menu";
import { SessionInterface } from "@/types/MeetingTypes";
import QuickLinks from "./QuickLinks";
import {
  handleCloseMeeting,
  handleRecording,
  handleStopRecording,
} from "../HuddleUtils";
import { APP_BASE_URL, BASE_URL } from "@/config/constants";
import { uploadFile } from "@/actions/uploadFile";
import { fetchApi } from "@/utils/api";
import MobileMenuDropdown from "./MobileMenuDropdown";

const BottomBar = ({
  daoName,
  hostAddress,
  // meetingStatus,
  // currentRecordingStatus,
  meetingData,
  meetingCategory,
}: {
  daoName: string;
  hostAddress: string;
  // meetingStatus: boolean | undefined;
  // currentRecordingStatus: boolean | undefined;
  meetingData?: SessionInterface;
  meetingCategory: string;
}) => {
  const { isAudioOn, enableAudio, disableAudio } = useLocalAudio();
  const { isVideoOn, enableVideo, disableVideo } = useLocalVideo();
  const [showLeaveDropDown, setShowLeaveDropDown] = useState<boolean>(false);
  const { leaveRoom, closeRoom, room } = useRoom();
  const [isLoading, setIsLoading] = useState(false);
  const params = useParams();

  const roomId = params.roomId as string | undefined;
  const [s3URL, setS3URL] = useState<string>("");
  const { chain } = useAccount();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { address } = useAccount();
  const { walletAddress } = useWalletAddress();
  const [privypass, setPrivyToken] = useState("");
  const {
    role,
    metadata,
    updateMetadata,
    peerId: localPeerId,
  } = useLocalPeer<PeerMetadata>();
  const { peerIds } = usePeerIds({ roles: ["host", "guest"] });

  const {
    isChatOpen,
    setIsChatOpen,
    isParticipantsOpen,
    setIsParticipantsOpen,
    isRecording,
    setIsRecording,
    isUploading,
    isScreenShared,
    setIsScreenShared,
    meetingRecordingStatus,
    setMeetingRecordingStatus,
  } = useStudioState();
  const { startScreenShare, stopScreenShare, shareStream } =
    useLocalScreenShare({
      onProduceStart(data) {
        if (data) {
          setIsScreenShared(true);
        }
      },
      onProduceClose(label) {
        if (label) {
          setIsScreenShared(false);
        }
      },
    });

  useEffect(() => {
    const fetchToken = async () => {
      const token = await getAccessToken();
      if (token) {
        setPrivyToken(token);
      }
    };

    fetchToken();
  }, [walletAddress]); // Empty dependency array ensures this runs only once.

  useDataMessage({
    async onMessage(payload, from, label) {
      if (label === "server-message") {
        const { s3URL } = JSON.parse(payload);
        const videoUri = s3URL;
        setS3URL(videoUri);

        const myHeaders = new Headers();
        const token = await getAccessToken();
        myHeaders.append("Content-Type", "application/json");
        if (walletAddress) {
          myHeaders.append("x-wallet-address", walletAddress);
          myHeaders.append("Authorization", `Bearer ${token}`);
        }

        const raw = JSON.stringify({
          meetingId: roomId,
          video_uri: videoUri,
        });

        const requestOptions = {
          method: "POST",
          headers: myHeaders,
          body: raw,
        };

        try {
          const response = await fetchApi("/update-video-uri", requestOptions);
          const result = await response.json();
        } catch (error) {
          console.error(error);
        }
      }
    },
  });

  useEffect(() => {
    const handleBeforeUnload = (event: any) => {
      if (role === "host") {
        event.preventDefault();
        event.returnValue = "Changes you made may not be saved.";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [role]);

  const handleEndCall = async (endMeet: string) => {
    setIsLoading(true);

    if (role === "host" && meetingRecordingStatus === true) {
      await handleStopRecording(
        roomId,
        walletAddress ?? "",
        privypass,
        setIsRecording
      );
    }

    toast("Meeting Ended");
    if (endMeet === "leave") {
      leaveRoom();
      setIsLoading(false);
      setShowLeaveDropDown(false);
    } else if (endMeet === "close") {
      if (role === "host") {
        let nft_image;
        try {
          const myHeaders = new Headers();
          myHeaders.append("Content-Type", "application/json");
          const requestOptions = {
            method: "GET",
            headers: myHeaders,
          };
          const imageResponse = await fetch(
            `${BASE_URL}/api/images/og/nft?daoName=${daoName}&meetingId=${roomId}`,
            requestOptions
          );

          try {
            const arrayBuffer = await imageResponse.arrayBuffer();
            const result = await uploadFile(arrayBuffer, daoName, roomId);
            nft_image = `ipfs://` + result.Hash;
          } catch (error) {
            console.error("Error in uploading file:", error);
          }
        } catch (error) {
          console.log("Error in generating OG image:::", error);
        }
        try {
          const myHeaders = new Headers();
          const token = await getAccessToken();
          myHeaders.append("Content-Type", "application/json");
          if (walletAddress) {
            myHeaders.append("x-wallet-address", walletAddress);
            myHeaders.append("Authorization", `Bearer ${token}`);
          }
          const requestOptions = {
            method: "PUT",
            headers: myHeaders,
            body: JSON.stringify({
              meetingId: roomId,
              meetingType: meetingCategory,
              recordedStatus: isRecording,
              meetingStatus: isRecording === true ? "Recorded" : "Finished",
              nft_image: nft_image,
              daoName: daoName,
            }),
          };

          const response = await fetchApi(
            `/update-recording-status`,
            requestOptions
          );
          if (role === "host") {
            setTimeout(async () => {
              await handleCloseMeeting(
                walletAddress ?? "",
                token,
                meetingCategory,
                roomId,
                daoName,
                hostAddress,
                meetingData,
                isRecording
              );
            }, 4000);
          }
        } catch (e) {
          console.log("Error: ", e);
        }
      }
      closeRoom();
      setIsLoading(false);
      setShowLeaveDropDown(false);
    } else {
      return;
    }

    if (meetingCategory === "officehours") {
      const myHeaders = new Headers();
      const token = await getAccessToken();
      myHeaders.append("Content-Type", "application/json");
      if (walletAddress) {
        myHeaders.append("x-wallet-address", walletAddress);
        myHeaders.append("Authorization", `Bearer ${token}`);
      }
      try {
        const res = await fetch(
          `${APP_BASE_URL}/api/update-office-hours/${hostAddress}`,
          {
            method: "PUT",
            headers: myHeaders,
          }
        );
        const res_data = await res.json();

        // if (res_data.success) {
        toast.success("Next Office hour is scheduled!");

        // }
      } catch (e) {
        console.log("error: ", e);
      }
    }
  };

  const handleCopyInviteLink = () => {
    const meetingLink = `${window.location.origin}/${daoName}/spaces/${roomId}`;
    navigator.clipboard.writeText(meetingLink);
    toast.success("Meeting link copied to clipboard!");
  };

  return (
    <>
      <footer className="flex items-center justify-center lg:justify-between pl-2 pr-4 sm:px-4 py-2 font-poppins bg-[#0a0a0a] lg:bg-transparent z-10">
        <div className="">
          <QuickLinks daoName={daoName} />
        </div>

        <div className={clsx("flex space-x-2 sm:space-x-3")}>
          <ButtonWithIcon
            content={isVideoOn ? "Turn off camera" : "Turn on camera"}
            onClick={() => {
              if (isVideoOn) {
                disableVideo();
              } else {
                enableVideo();
              }
            }}
            className={clsx(
              isVideoOn ? "bg-gray-500" : "bg-red-500 hover:bg-red-400"
            )}
          >
            {isVideoOn ? BasicIcons.on.cam : BasicIcons.off.cam}
          </ButtonWithIcon>
          <ButtonWithIcon
            content={isAudioOn ? "Turn off microphone" : "Turn on microphone"}
            onClick={() => {
              if (isAudioOn) {
                disableAudio();
              } else {
                enableAudio();
              }
            }}
            className={clsx(
              isAudioOn ? "bg-gray-500" : "bg-red-500 hover:bg-red-400"
            )}
          >
            {isAudioOn ? BasicIcons.on.mic : BasicIcons.off.mic}
          </ButtonWithIcon>
          <ButtonWithIcon
            content={
              isScreenShared && shareStream !== null
                ? "Stop Sharing"
                : shareStream !== null
                ? "Stop Sharing"
                : isScreenShared
                ? "Only one screen share is allowed at a time"
                : "Share Screen"
            }
            onClick={() => {
              if (isScreenShared && shareStream !== null) {
                stopScreenShare();
              } else if (isScreenShared) {
                toast.error("Only one screen share is allowed at a time");
                return;
              }
              if (shareStream !== null) {
                stopScreenShare();
              } else {
                startScreenShare();
              }
            }}
            className={clsx(
              `hidden lg:block bg-[#202020] hover:bg-gray-500/50 ${
                (shareStream !== null || isScreenShared) && "bg-gray-500/80"
              }`
            )}
          >
            {BasicIcons.screenShare}
          </ButtonWithIcon>
          <ButtonWithIcon
            content={metadata?.isHandRaised ? "Lower Hand" : "Raise Hand"}
            onClick={() => {
              updateMetadata({
                displayName: metadata?.displayName || "",
                avatarUrl: metadata?.avatarUrl || "",
                isHandRaised: !metadata?.isHandRaised,
                walletAddress: metadata?.walletAddress || walletAddress || "",
              });
            }}
            className={clsx(
              `hidden lg:block bg-[#202020] hover:bg-gray-500/50 ${
                metadata?.isHandRaised && "bg-gray-500/80"
              }`
            )}
          >
            {BasicIcons.handRaise}
          </ButtonWithIcon>
          {/* <ButtonWithIcon onClick={leaveRoom}>{BasicIcons.end}</ButtonWithIcon> */}

          <div>
            <ReactionBar />
          </div>

          <MobileMenuDropdown
            isVideoOn={isVideoOn}
            isAudioOn={isAudioOn}
            isScreenShared={isScreenShared}
            shareStream={shareStream}
            metadata={metadata}
            isChatOpen={isChatOpen}
            isParticipantsOpen={isParticipantsOpen}
            peerCount={Object.keys(peerIds).length + 1}
            onToggleVideo={() => {
              if (isVideoOn) {
                disableVideo();
              } else {
                enableVideo();
              }
            }}
            onToggleAudio={() => {
              if (isAudioOn) {
                disableAudio();
              } else {
                enableAudio();
              }
            }}
            onToggleScreen={() => {
              if (isScreenShared && shareStream !== null) {
                stopScreenShare();
              } else if (isScreenShared) {
                toast.error("Only one screen share is allowed at a time");
                return;
              }
              if (shareStream !== null) {
                stopScreenShare();
              } else {
                startScreenShare();
              }
            }}
            onToggleHand={() => {
              updateMetadata({
                displayName: metadata?.displayName || "",
                avatarUrl: metadata?.avatarUrl || "",
                isHandRaised: !metadata?.isHandRaised,
                walletAddress: metadata?.walletAddress || address || "",
              });
            }}
            onToggleChat={() => setIsChatOpen(!isChatOpen)}
            onToggleParticipants={() =>
              setIsParticipantsOpen(!isParticipantsOpen)
            }
            onCopyLink={handleCopyInviteLink}
          />

          <div className="flex cursor-pointer items-center">
            <Dropdown
              triggerChild={BasicIcons.leave}
              open={showLeaveDropDown}
              onOpenChange={() => setShowLeaveDropDown((prev) => !prev)}
            >
              {role === "host" && (
                <Strip
                  type="close"
                  title={isLoading ? "Leaving..." : "End spaces for all"}
                  variant="danger"
                  onClick={() => handleEndCall("close")}
                />
              )}
              {role !== "host" && (
                <Strip
                  type="leave"
                  title={isLoading ? "Leaving..." : "Leave the spaces"}
                  variant="danger"
                  onClick={() => handleEndCall("leave")}
                />
              )}
            </Dropdown>
          </div>

          <ButtonWithIcon
            content={meetingRecordingStatus ? "Stop Recording" : "Record"}
            onClick={() =>
              handleRecording(
                roomId,
                walletAddress ?? "",
                privypass,
                isRecording,
                setIsRecording,
                meetingRecordingStatus,
                setMeetingRecordingStatus
              )
            }
            className="bg-red-500 lg:hidden"
          >
            {isUploading ? BasicIcons.spin : BasicIcons.record}
          </ButtonWithIcon>
        </div>

        <div className="hidden lg:flex space-x-3">
          {role === "host" && (
            <Button
              className="flex gap-2 bg-red-500 hover:bg-red-400 text-white text-md font-semibold"
              onClick={() =>
                handleRecording(
                  roomId,
                  walletAddress ?? "",
                  privypass,
                  isRecording,
                  setIsRecording,
                  meetingRecordingStatus,
                  setMeetingRecordingStatus
                )
              }
            >
              {isUploading ? BasicIcons.spin : BasicIcons.record}{" "}
              <span className="hidden lg:block">
                {meetingRecordingStatus ? "Stop Recording" : "Record"}
              </span>
            </Button>
          )}
          <ButtonWithIcon
            content="Participants"
            onClick={() => setIsParticipantsOpen(!isParticipantsOpen)}
            className={clsx("bg-[#202020] hover:bg-gray-500/50")}
          >
            <div className="flex items-center justify-center">
              {BasicIcons.people}
              <span className="text-white ps-2">
                {Object.keys(peerIds).length + 1}
              </span>
            </div>
          </ButtonWithIcon>
          <ButtonWithIcon
            content="Chat"
            onClick={() => setIsChatOpen(!isChatOpen)}
            className={clsx("bg-[#202020] hover:bg-gray-500/50")}
          >
            {BasicIcons.chat}
          </ButtonWithIcon>
        </div>
      </footer>
    </>
  );
};

export default BottomBar;