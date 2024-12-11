"use client";

import RemotePeer from "@/components/Huddle/remotePeer";
import { useStudioState } from "@/store/studioState";
import { BasicIcons } from "@/utils/BasicIcons";
import {
  useDataMessage,
  useDevices,
  useLocalAudio,
  useLocalMedia,
  useLocalPeer,
  useLocalScreenShare,
  useLocalVideo,
  usePeerIds,
  useRoom,
} from "@huddle01/react/hooks";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useParams, usePathname } from "next/navigation";
import { useRouter } from "next-nprogress-bar";
import React, { useCallback, useEffect, useRef, useState } from "react";
import BottomBar from "@/components/Huddle/Bottombar/bottomBar";
import { Button } from "@/components/ui/button";
import { PeerMetadata } from "@/utils/types";
import ChatBar from "@/components/Huddle/sidebars/ChatBar/chatbar";
import ParticipantsBar from "@/components/Huddle/sidebars/participantsSidebar/participantsBar";
import Video from "@/components/Huddle/Media/Video";
import { Role } from "@huddle01/server-sdk/auth";
import clsx from "clsx";
import GridContainer from "@/components/Huddle/GridContainer";
import RemoteScreenShare from "@/components/Huddle/remoteScreenShare";
import Camera from "@/components/Huddle/Media/Camera";
import { RotatingLines } from "react-loader-spinner";
import Link from "next/link";
import { Tooltip } from "@nextui-org/react";
import { PiRecordFill } from "react-icons/pi";
import ParticipantTile from "@/components/Huddle/ParticipantTile";
import { NestedPeerListIcons } from "@/utils/PeerListIcons";
// import logo from "@/assets/images/daos/CCLogo1.png";
import Image from "next/image";
import { headers } from "next/headers";
// import UpdateSessionDetails from "@/components/MeetingPreview/UpdateSessionDetails";
import MeetingRecordingModal from "@/components/ComponentUtils/MeetingRecordingModal";
import toast from "react-hot-toast";
import {
  handleCloseMeeting,
  startRecording,
} from "@/components/Huddle/HuddleUtils";
import { BASE_URL } from "@/config/constants";
import { Maximize2, Minimize2 } from "lucide-react";
import AudioController from "@/components/Huddle/Media/AudioController";

export default function Component() {
  const params = useParams();
  const roomId = params?.roomId as string;

  const { state } = useRoom({
    onLeave: () => {
      push(`/meeting/session/${roomId}/lobby`);
    },
  });

  const { isVideoOn, enableVideo, disableVideo, stream } = useLocalVideo();
  const {
    isAudioOn,
    enableAudio,
    disableAudio,
    stream: audioStream,
  } = useLocalAudio();
  const { fetchStream } = useLocalMedia();
  const { setPreferredDevice: setCamPrefferedDevice } = useDevices({
    type: "cam",
  });
  const { setPreferredDevice: setAudioPrefferedDevice } = useDevices({
    type: "mic",
  });
  const {
    name,
    isChatOpen,
    isParticipantsOpen,
    addChatMessage,
    videoDevice,
    audioInputDevice,
    isScreenShared,
    avatarUrl,
    isRecording,
    setIsRecording,
    meetingRecordingStatus,
    setMeetingRecordingStatus,
  } = useStudioState();
  const videoRef = useRef<HTMLVideoElement>(null);
  const { peerIds } = usePeerIds({
    roles: [Role.HOST, Role.GUEST],
  });
  const [isCopied, setIsCopied] = useState(false);
  const { peerId } = useLocalPeer();
  const { metadata, role } = useLocalPeer<PeerMetadata>();
  const { shareStream } = useLocalScreenShare();
  const { push } = useRouter();
  const path = usePathname();
  const [isAllowToEnter, setIsAllowToEnter] = useState<boolean>();
  const [notAllowedMessage, setNotAllowedMessage] = useState<string>();
  const [videoStreamTrack, setVideoStreamTrack] = useState<any>("");
  const [showFeedbackPopups, setShowFeedbackPopups] = useState(false);
  const [showModal, setShowModal] = useState(true);
  const { sendData } = useDataMessage();
  const meetingCategory = usePathname().split("/")[2];
  const [isLessScreen, setIsLessScreen] = useState(false);
  const [isRemoteLessScreen, setIsRemoteLessScreen] = useState(false);

  const [remoteVideoTracks, setRemoteVideoTracks] = useState<
    Record<string, MediaStreamTrack | null>
  >({});

  const handleVideoTrackUpdate = useCallback(
    (peerId: string, videoTrack: MediaStreamTrack | null) => {
      setRemoteVideoTracks((prev) => ({
        ...prev,
        [peerId]: videoTrack,
      }));
    },
    []
  );

  const toggleFullScreen = () => {
    setIsLessScreen(!isLessScreen);
  };

  const handleCopy = () => {
    if (typeof window === "undefined") return;

    navigator.clipboard.writeText(`${BASE_URL}${path}/lobby`);
    setIsCopied(true);

    setTimeout(() => {
      setIsCopied(false);
    }, 3000);
  };

  // Function to truncate long addresses
  const truncateAddress = (address: string, maxLength = 30) => {
    if (address.length <= maxLength) return address;
    return address.slice(0, maxLength) + "...";
  };

  const { updateMetadata } = useLocalPeer<{
    displayName: string;
    avatarUrl: string;
    isHandRaised: boolean;
    walletAddress: string;
  }>();

  const [reaction, setReaction] = useState("");

  useDataMessage({
    async onMessage(payload, from, label) {
      if (label === "chat") {
        const { message, name } = JSON.parse(payload);
        addChatMessage({
          name: name,
          text: message,
          isUser: from === peerId,
        });
      }
      if (from === peerId) {
        if (label === "reaction") {
          setReaction(payload);
          setTimeout(() => {
            setReaction("");
          }, 5000);
        }
      }
      if (label === "recordingStatus") {
        const status = JSON.parse(payload).isRecording;
        setIsRecording(status);
      }
      if (label === "requestRecordingStatus" && role === "host") {
        sendData({
          to: [from],
          payload: JSON.stringify({ isRecording: isRecording }),
          label: "recordingStatus",
        });
      }
    },
  });

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  useEffect(() => {
    if (state === "idle") {
      push(`/meeting/session/${roomId}/lobby`);
      return;
    }

    updateMetadata({
      displayName: name,
      avatarUrl: avatarUrl,
      isHandRaised: metadata?.isHandRaised || false,
      walletAddress: "",
    });
  }, []);

  useEffect(() => {
    setCamPrefferedDevice(videoDevice.deviceId);
    if (isVideoOn) {
      disableVideo();
      const changeVideo = async () => {
        const { stream } = await fetchStream({
          mediaDeviceKind: "cam",
        });
        if (stream) {
          await enableVideo({ customVideoStream: stream });
        }
      };
      changeVideo();
    }
  }, [videoDevice]);

  useEffect(() => {
    setAudioPrefferedDevice(audioInputDevice.deviceId);
    if (isAudioOn) {
      disableAudio();
      const changeAudio = async () => {
        const { stream } = await fetchStream({
          mediaDeviceKind: "mic",
        });
        if (stream) {
          enableAudio({ customAudioStream: stream });
        }
      };
      changeAudio();
    }
  }, [audioInputDevice]);

  const updateRecordingStatus = (status: any) => {
    // setIsRecording(status);
    // setMeetingRecordingStatus(status);
    sendData({
      to: "*",
      payload: JSON.stringify({ isRecording: status }),
      label: "recordingStatus",
    });
  };

  const handleMeetingModalClose = async (result: boolean) => {
    if (role === "host") {
      setShowModal(false);
      const meetingData = {
        meetingId: roomId,
        isMeetingRecorded: result,
        recordingStatus: result,
      };
      sessionStorage.setItem("meetingData", JSON.stringify(meetingData));
      setIsRecording(result);
      setMeetingRecordingStatus(result);
      updateRecordingStatus(result);
      if (result) {
        startRecording(
          roomId,
          setIsRecording
          // walletAddress ? walletAddress : "",
          // token ? token : ""
        );
      }
    }
  };

  console.log("avatar url: ", avatarUrl);

  return (
    <>
      {/* {isAllowToEnter ? ( */}
      <div
        className={clsx(
          `flex flex-col h-screen font-poppins bg-contain bg-center bg-no-repeat `
        )}
      >
        <div className="bg-[#0a0a0a] flex flex-col h-screen">
          <header className="flex items-center justify-between pt-4 px-4 md:px-6">
            <div className="flex items-center py-2 space-x-2">
              <div className="text-3xl font-semibold tracking-wide font-quanty">
                <span className="text-white">Chora</span>
                <span className="text-blue-shade-100">Club</span>
              </div>
            </div>
            <div className="flex items-center justify-center gap-4">
              {(isRecording || meetingRecordingStatus) && (
                <Tooltip
                  showArrow
                  content={
                    <div className="font-poppins">
                      This meeting is being recorded
                    </div>
                  }
                  placement="left"
                  className="rounded-md bg-opacity-90 max-w-96"
                  closeDelay={1}
                >
                  <span>
                    <PiRecordFill color="#c42727" size={22} />
                  </span>
                </Tooltip>
              )}

              <div className="flex space-x-3">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button className="flex gap-2 bg-[#202020] text-gray-200 hover:bg-gray-500/50">
                      {BasicIcons.invite}
                      <span className="hidden lg:block">Invite</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-72">
                    <div className="flex items-center space-x-2 p-2">
                      <span
                        className="flex-grow p-2  bg-[#2f2f2f] rounded-lg  text-white truncate text-sm"
                        title={`${BASE_URL}${path}`}
                      >
                        {typeof window !== "undefined" &&
                          truncateAddress(`${BASE_URL}${path}`)}
                      </span>
                      <Button
                        className="bg-[#2f2f2f] hover:bg-gray-600/50 text-white text-sm px-3 py-2"
                        onClick={handleCopy}
                      >
                        {isCopied ? "Copied" : "Copy"}
                      </Button>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </header>
          <main
            className={`relative transition-all ease-in-out flex items-center justify-center flex-1 duration-300 w-full h-[80%] p-2`}
          >
            {shareStream && !isLessScreen && (
              <div
                // ref={draggableRef}
                className={`absolute bottom-4 left-4 bg-[#131212] bg-opacity-80 rounded-lg flex items-center justify-center min-w-[150px] min-h-[150px] z-20 cursor-move touch-none`}
                // style={{
                //   transform: `translate(${draggablePosition.x}px, ${draggablePosition.y}px)`,
                // }}
              >
                {avatarUrl && (
                  <div className=" rounded-full w-20 h-20">
                    <Image
                      alt="image"
                      src={avatarUrl}
                      className="maskAvatar object-cover object-center"
                      width={100}
                      height={100}
                    />
                  </div>
                )}
                <span className="absolute bottom-2 left-2 text-white">You</span>
              </div>
            )}
            <div
              className={`relative flex flex-col lg:flex-row w-full h-full ${
                isRemoteLessScreen || !isScreenShared
                  ? ""
                  : `${
                      isLessScreen || !isScreenShared
                        ? ""
                        : "bg-[#202020] rounded-lg justify-center"
                    }`
              } `}
            >
              {shareStream && (
                <div className={`w-full `}>
                  <GridContainer className="w-full h-full relative">
                    <>
                      <Tooltip
                        content={isLessScreen ? "Full Screen" : "Less Screen"}
                      >
                        <Button
                          className="absolute bottom-4 right-4 z-10 bg-[#0a0a0a] hover:bg-[#131212] rounded-full"
                          onClick={toggleFullScreen}
                        >
                          {isLessScreen ? <Maximize2 /> : <Minimize2 />}
                        </Button>
                      </Tooltip>
                      <Video
                        stream={videoStreamTrack}
                        name={metadata?.displayName ?? "guest"}
                      />
                    </>
                  </GridContainer>
                  {/* {!isLessScreen && (
                      <div
                      ref={draggableRef}
                        className={`absolute bottom-4 left-4 bg-[#131212] bg-opacity-80 rounded-lg flex items-center justify-center min-w-[150px] min-h-[150px] z-20 cursor-move touch-none`}
                        style={{
                          transform: `translate(${draggablePosition.x}px, ${draggablePosition.y}px)`,
                        }}
                      >
                        {metadata?.avatarUrl && (
                          <div className=" rounded-full w-20 h-20">
                            <Image
                              alt="image"
                              src={metadata?.avatarUrl}
                              className="maskAvatar object-cover object-center"
                              width={100}
                              height={100}
                            />
                          </div>
                        )}
                        <span className="absolute bottom-2 left-2 text-white">
                          You
                        </span>
                      </div>
                    )} */}
                </div>
              )}
              {peerIds.map((peerId) => (
                <RemoteScreenShare
                  key={peerId}
                  peerId={peerId}
                  isRemoteLessScreen={isRemoteLessScreen}
                  setIsRemoteLessScreen={setIsRemoteLessScreen}
                  onVideoTrackUpdate={handleVideoTrackUpdate}
                />
              ))}
              {/* {console.log(isRemoteLessScreen, "remote screen share")}
                {console.log(isScreenShared,"local screen share")}
                {console.log(isLessScreen,"islessscreen")}
                {console.log(isRemoteLessScreen,"isremotelessscreen")} */}
              <section
                className={`${
                  isRemoteLessScreen || !isScreenShared
                    ? "grid"
                    : `${isLessScreen || !isScreenShared ? "grid" : "hidden"}`
                } py-4 lg:py-0 lg:px-4 gap-2 w-full h-full overflow-y-auto scrollbar-thin scrollbar-track-gray-700 scrollbar-thumb-blue-600 ${
                  peerIds.length === 0
                    ? "grid-cols-1"
                    : peerIds.length === 1
                    ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 "
                    : "grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 1.5xl:grid-cols-2"
                }`}
              >
                {role !== Role.BOT && (
                  <div
                    className={`relative 
                        ${
                          isAudioOn
                            ? "p-[3px] bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg"
                            : "bg-[#202020] bg-opacity-80"
                        }
                      rounded-lg flex min-w-[150px] min-h-[150px] overflow-hidden`}
                  >
                    <div className="bg-[#202020] flex flex-col rounded-md w-full h-full items-center justify-center">
                      <div className="absolute left-4 top-4 text-3xl z-10">
                        {reaction}
                      </div>
                      {metadata?.isHandRaised && (
                        <span className="absolute top-4 right-4 text-4xl text-gray-200 font-medium">
                          ✋
                        </span>
                      )}

                      {stream ? (
                        <>
                          <Camera
                            stream={stream}
                            name={metadata?.displayName ?? "guest"}
                          />
                        </>
                      ) : (
                        <div className="flex w-24 h-24 rounded-full">
                          {avatarUrl && (
                            <div className=" rounded-full w-24 h-24">
                              <Image
                                alt="image"
                                src={avatarUrl}
                                className="maskAvatar object-cover object-center"
                                width={100}
                                height={100}
                              />
                            </div>
                          )}
                        </div>
                      )}
                      <span className="absolute bottom-4 left-4 text-white font-medium">
                        {`${metadata?.displayName} (You)`}
                      </span>
                      <span className="absolute bottom-4 right-4">
                        {isAudioOn
                          ? NestedPeerListIcons.active.mic
                          : NestedPeerListIcons.inactive.mic}
                      </span>
                    </div>
                  </div>
                )}

                {isScreenShared ? (
                  <>
                    {peerIds.length > 2 ? (
                      <>
                        {peerIds.slice(0, 1).map((peerId) => (
                          <RemotePeer
                            key={peerId}
                            peerId={peerId}
                            className={clsx("sm:hidden")}
                          />
                        ))}
                        <ParticipantTile className={clsx("sm:hidden")} />
                      </>
                    ) : (
                      peerIds.map((peerId) => (
                        <RemotePeer
                          key={peerId}
                          peerId={peerId}
                          className={clsx("sm:hidden")}
                        />
                      ))
                    )}
                    {peerIds.length > 3 ? (
                      <>
                        {peerIds.slice(0, 2).map((peerId) => (
                          <RemotePeer
                            key={peerId}
                            peerId={peerId}
                            className={clsx("hidden sm:flex md:hidden")}
                          />
                        ))}

                        <ParticipantTile
                          className={clsx("hidden sm:flex md:hidden")}
                        />
                      </>
                    ) : (
                      peerIds.map((peerId) => (
                        <RemotePeer
                          key={peerId}
                          peerId={peerId}
                          className={clsx("hidden sm:flex md:hidden")}
                        />
                      ))
                    )}
                    {peerIds.length > 2 ? (
                      <>
                        {peerIds.slice(0, 1).map((peerId) => (
                          <RemotePeer
                            key={peerId}
                            peerId={peerId}
                            className={clsx("hidden md:flex lg:hidden")}
                          />
                        ))}
                        <ParticipantTile
                          className={clsx("hidden md:flex lg:hidden")}
                        />
                      </>
                    ) : (
                      peerIds.map((peerId) => (
                        <RemotePeer
                          key={peerId}
                          peerId={peerId}
                          className={clsx("hidden md:flex lg:hidden")}
                        />
                      ))
                    )}
                    {peerIds.length > 3 ? (
                      <>
                        {peerIds.slice(0, 2).map((peerId) => (
                          <RemotePeer
                            key={peerId}
                            peerId={peerId}
                            className={clsx("hidden lg:flex ")}
                          />
                        ))}
                        <ParticipantTile className={clsx("hidden lg:flex ")} />
                      </>
                    ) : (
                      peerIds.map((peerId) => (
                        <RemotePeer
                          key={peerId}
                          peerId={peerId}
                          className={clsx("hidden lg:flex ")}
                        />
                      ))
                    )}
                  </>
                ) : peerIds.length > 3 ? (
                  <>
                    {peerIds.slice(0, 2).map((peerId) => (
                      <RemotePeer key={peerId} peerId={peerId} />
                    ))}

                    <GridContainer
                      className={clsx(
                        "bg-[#202020] bg-opacity-80 relative rounded-lg flex flex-col items-center justify-center min-w-[150px] min-h-[150px] border-none"
                      )}
                    >
                      <div className="flex items-center justify-center w-24 h-24 rounded-full bg-[#232631] text-[#717682] text-3xl font-semibold ">
                        +{peerIds.length - 2}
                      </div>
                    </GridContainer>
                  </>
                ) : (
                  peerIds.map((peerId) => (
                    <RemotePeer key={peerId} peerId={peerId} />
                  ))
                )}
              </section>
            </div>
            {isChatOpen && <ChatBar />}
            {isParticipantsOpen && <ParticipantsBar />}
          </main>
          <BottomBar
            // daoName={daoName}
            // hostAddress={hostAddress}
            // meetingStatus={meetingRecordingStatus}
            // currentRecordingStatus={currentRecordingState}
            // meetingData={meetingData}
            // meetingCategory={meetingCategory}
          />
          <AudioController />
        </div>
      </div>

      {role === "host" && isRecording !== true && (
        <MeetingRecordingModal
          show={showModal}
          onClose={handleMeetingModalClose}
        />
      )}
    </>
  );
}
