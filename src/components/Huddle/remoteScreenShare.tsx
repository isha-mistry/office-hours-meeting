import { PeerMetadata } from "@/utils/types";
import { useRemotePeer, useRemoteScreenShare } from "@huddle01/react/hooks";
import Video from "./Media/Video";
import Audio from "./Media/Audio";
import GridContainer from "./GridContainer";
import clsx from "clsx";
import { useEffect, useState } from "react";
import { useStudioState } from "@/store/studioState";
import { Maximize2, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@nextui-org/react";

interface RemotePeerProps {
  peerId: string;
  isRemoteLessScreen: boolean;
  setIsRemoteLessScreen: (value: boolean) => void;
  onVideoTrackUpdate: (
    peerId: string,
    videoTrack: MediaStreamTrack | null
  ) => void;
}

const RemoteScreenShare = ({
  peerId,
  isRemoteLessScreen,
  setIsRemoteLessScreen,
  onVideoTrackUpdate,
}: RemotePeerProps) => {
  // const RemoteScreenShare = ({ peerId, isFullScreen, setIsFullScreen }: RemotePeerProps) => {
  const { setIsScreenShared } = useStudioState();
  const { videoTrack, audioTrack } = useRemoteScreenShare({
    peerId,
    onPlayable(data) {
      if (data) {
        setIsScreenShared(true);
      }
    },
    onClose() {
      setIsScreenShared(false);
    },
  });
  const { metadata } = useRemotePeer<PeerMetadata>({ peerId });
  const [videoStreamTrack, setVideoStreamTrack] = useState<any>("");
  // const [isRemoteLessScreen, setIsRemoteLessScreen] = useState(false);

  const toggleFullScreen = () => {
    setIsRemoteLessScreen(!isRemoteLessScreen);
  };

  // useEffect(() => {
  //   setVideoStreamTrack(videoTrack && new MediaStream([videoTrack]));
  // }, [videoTrack]);
  useEffect(() => {
    if (videoTrack) {
      const newVideoStreamTrack = new MediaStream([videoTrack]);
      setVideoStreamTrack(newVideoStreamTrack);
      onVideoTrackUpdate(peerId, videoTrack);
    } else {
      setVideoStreamTrack(null);
      onVideoTrackUpdate(peerId, null);
    }
  }, [videoTrack, peerId, onVideoTrackUpdate]);

  return (
    <>
      {videoTrack && (
        <div className={`w-full`}>
          <GridContainer className="w-full h-full relative">
            <>
              <Tooltip
                content={isRemoteLessScreen ? "Full Screen" : "Less Screen"}
              >
                <Button
                  className="absolute bottom-4 right-4 z-10 bg-[#0a0a0a] hover:bg-[#131212] rounded-full"
                  onClick={toggleFullScreen}
                >
                  {isRemoteLessScreen ? <Maximize2 /> : <Minimize2 />}
                </Button>
              </Tooltip>
              <Video
                stream={videoStreamTrack}
                name={metadata?.displayName ?? "guest"}
              />
              {audioTrack && (
                <Audio
                  stream={audioTrack && new MediaStream([audioTrack])}
                  // name={metadata?.displayName ?? "guest"}
                />
              )}
            </>
          </GridContainer>
        </div>
      )}
    </>
  );
};

export default RemoteScreenShare;
