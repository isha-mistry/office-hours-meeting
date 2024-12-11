import React, { useEffect, useState } from "react";
import img from "@/assets/images/daos/attestation.png";
import Image from "next/image";
import { RxCross2 } from "react-icons/rx";
import Link from "next/link";
import { FaArrowRight } from "react-icons/fa6";
import Confetti from "react-confetti";
import { BsTwitterX } from "react-icons/bs";

function AttestationModal({
  isOpen,
  onClose,
  meetingId,
}: {
  isOpen: boolean;
  onClose: () => void;
  meetingId: string;
}) {
  // const [modalOpen, setModalOpen] = useState(props);

  useEffect(() => {
    const storedStatus = sessionStorage.getItem("meetingData");
    if (storedStatus) {
      const parsedStatus = JSON.parse(storedStatus);
      if (parsedStatus.meetingId === meetingId) {
        sessionStorage.removeItem("meetingData");
      }
    }
  }, []);

  const toggleModal = () => {
    onClose();
  };

  const shareOnTwitter = () => {
    const url = encodeURIComponent(`https://app.chora.club/`);
    const text = encodeURIComponent(
      `Just attended an amazing session on #Web3 in @ChoraClub! Learned so much and got a deeper understanding of ecosystem. Feeling inspired and ready to dive in!🚀 \n👉 ${decodeURIComponent(
        url
      )}\n\n#choraclub #session #growth`
    );

    // Twitter share URL
    const twitterUrl = `https://twitter.com/intent/tweet?text=${text}`;

    // Open Twitter share dialog
    window.open(twitterUrl, "_blank");
  };

  return (
    <div>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center font-poppins">
          <div
            className="absolute inset-0 bg-[#0a0a0a]"
            // onClick={toggleModal}
          ></div>
          <div className="z-50 bg-white rounded-3xl max-w-7xl mx-3">
            <Confetti recycle={false} />
            <div className="flex flex-col sm:flex-row">
              <div className="relative">
                <Image
                  src={img}
                  alt="image"
                  height={300}
                  width={300}
                  className="rounded-t-3xl sm:rounded-tl-3xl sm:rounded-tr-none sm:rounded-l-3xl object-none"
                />
                <button
                  className="sm:hidden text-black font-semibold bg-white rounded-full hover:bg-gray-200 absolute top-3 right-4 p-0.5"
                  onClick={toggleModal}
                >
                  <RxCross2 size={12} />
                </button>
              </div>
              <div className="flex flex-col items-center justify-center relative sm:px-4 1.5md:px-14 2md:px-20">
                <button
                  className="hidden sm:block text-white bg-black rounded-full hover:bg-gray-800 absolute top-3 right-4 p-0.5"
                  onClick={toggleModal}
                >
                  <RxCross2 size={12} />
                </button>
                <div className="pt-6 pb-3 sm:py-0 sm:px-4 text-gray-900">
                  <h2 className="text-xl md:text-2xl font-bold text-center">
                    Thanks for joining us!🎉
                  </h2>
                  <div className="text-xs md:text-base font-medium py-2">
                    Your attestation will be on its way shortly. 📜✨
                  </div>
                </div>

                <div className="flex-col md:flex-row flex items-center text-blue-shade-100 mb-6 sm:mb-0 sm:mt-6 gap-2 sm:gap-0">
                  <div className="flex items-center">
                    <FaArrowRight size={10} className="mt-1 mr-1" />
                    <div className="mr-8">
                      <Link
                        href={
                          "https://app.deform.cc/form/580f4057-b21e-4052-bf93-6b85e28a6032/?page_number=0"
                        }
                        target="_blank"
                        className="ps-[2px] underline font-semibold text-xs"
                      >
                        Share Your Feedback!
                      </Link>
                    </div>
                  </div>

                  <div>
                    {/* <div className="flex justify-center"> */}
                    <button
                      className="bg-black text-white rounded-full px-4 py-2 flex items-center space-x-1"
                      onClick={shareOnTwitter}
                    >
                      Share on Twitter
                      <BsTwitterX className="ml-2" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AttestationModal;
