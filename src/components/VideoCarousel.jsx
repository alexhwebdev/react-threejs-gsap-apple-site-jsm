import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/all";
gsap.registerPlugin(ScrollTrigger);
import { useEffect, useRef, useState } from "react";

import { hightlightsSlides } from "../constants";
import { pauseImg, playImg, replayImg } from "../utils";

const VideoCarousel = () => {
  const videoRef = useRef([]);
  const videoSpanRef = useRef([]);
  const videoDivRef = useRef([]);

  // video and indicator
  const [video, setVideo] = useState({
    isEnd: false,
    startPlay: false,
    videoId: 0,
    isLastVideo: false,
    isPlaying: false,
  });

  const [loadedData, setLoadedData] = useState([]);
  const { isEnd, isLastVideo, startPlay, videoId, isPlaying } = video;
  console.log('video ', video)

  useGSAP(() => {
    // slider animation to move the video out of the screen and bring the next video in
    gsap.to("#slider", {
      transform: `translateX(${-100 * videoId}%)`,
      duration: 2,
      ease: "power2.inOut", // show visualizer https://gsap.com/docs/v3/Eases
    });

    // video animation to play the video when it is in the view
    gsap.to("#video", {
      scrollTrigger: {
        trigger: "#video",
        toggleActions: "restart none none none",
      },
      onComplete: () => {
        setVideo((pre) => ({
          ...pre,
          startPlay: true,
          isPlaying: true,
        }));
      },
    });
  }, [isEnd, videoId]);

  // Pagination progress animation
  useEffect(() => {
    let currentProgress = 0;
    let span = videoSpanRef.current;
    // console.log('videoSpanRef ', videoSpanRef)
    // console.log('span ', span)
    // console.log('span[videoId] ', span[videoId])
    // console.log('isPlaying ', isPlaying)

    if (span[videoId]) {
      // animate progress of video
      let animProgressIndicator = gsap.to(span[videoId], {
        onUpdate: () => {
          // get the progress of the video
          const progress = Math.ceil(animProgressIndicator.progress() * 100);
          // console.log('pag - progress ', progress)

          if (progress != currentProgress) {
            currentProgress = progress;

            // set the width of the progress bar
            // console.log('videoDivRef ', videoDivRef)
            gsap.to(videoDivRef.current[videoId], {
              width:
                window.innerWidth < 760
                  ? "10vw" // mobile
                  : window.innerWidth < 1200
                  ? "10vw" // tablet
                  : "4vw", // laptop
            });

            // set the background color of the progress bar
            gsap.to(span[videoId], {
              width: `${currentProgress}%`,
              backgroundColor: "white",
            });
          }
        },

        // on video end, replace progress bar with indicator and change bkgd color
        onComplete: () => {
          console.log('isPlaying ', isPlaying)
          if (isPlaying) {
            gsap.to(videoDivRef.current[videoId], {
              width: "12px",
            });
            gsap.to(span[videoId], {
              backgroundColor: "#afafaf",
            });
          }
        },
      });
      console.log('animProgressIndicator ', animProgressIndicator)
      console.log('videoId ', videoId)

      // If video id = 0, restart animation
      if (videoId == 0) {
        animProgressIndicator.restart();
      }

      console.log('videoRef ', videoRef)
      // update the progress bar
      const animUpdate = () => {
        animProgressIndicator.progress(
          videoRef.current[videoId].currentTime /
          hightlightsSlides[videoId].videoDuration
        );
      };
      console.log('animUpdate ', animUpdate)

      if (isPlaying) {
        // ticker to update the progress bar
        gsap.ticker.add(animUpdate); // GSAP ticker is an internal update loop
      } else {
        // remove the ticker when the video is paused (progress bar is stopped)
        gsap.ticker.remove(animUpdate);
      }
    }
  }, [videoId, startPlay]);

  // Trigger Play
  useEffect(() => {
    console.log('loadedData ', loadedData)
    if (loadedData.length > 3) {
      console.log('!isPlaying ', !isPlaying)
      if (!isPlaying) {
        videoRef.current[videoId].pause(); // If Not Playing and video at end, pause it.
      } else {
        startPlay && videoRef.current[videoId].play();
      }
    }
  }, [startPlay, videoId, isPlaying, loadedData]);

  // vd id is the id for every video until id becomes number 3
  const handleProcess = (type, i) => {
    switch (type) {
      case "video-end":
        setVideo((pre) => ({ ...pre, isEnd: true, videoId: i + 1 }));
        break;

      case "video-last":
        setVideo((pre) => ({ ...pre, isLastVideo: true }));
        break;

      case "video-reset":
        setVideo((pre) => ({ ...pre, videoId: 0, isLastVideo: false }));
        break;

      case "pause":
        setVideo((pre) => ({ ...pre, isPlaying: !pre.isPlaying }));
        break;

      case "play":
        setVideo((pre) => ({ ...pre, isPlaying: !pre.isPlaying }));
        break;

      default:
        return video;
    }
  };

  // i = index, e = event. 
  const handleLoadedMetaData = (i, e) => setLoadedData(
    (pre) => [...pre, e]
  );

  return (
    <>
      <div className="flex items-center">
        {hightlightsSlides.map((list, i) => (
          <div key={list.id} id="slider" className="sm:pr-20 pr-10">
            <div className="video-carousel_container">
              {/* ---------- VIDEO ---------- */}
              <div className="w-full h-full flex-center rounded-3xl overflow-hidden bg-black">
                <video
                  id="video"
                  playsInline={true}
                  className={`${
                    list.id === 2 && "translate-x-44"
                  } pointer-events-none`}
                  preload="auto"
                  muted
                  // Find index in videoRef array, and set it to this video element.
                  ref={(el) => (videoRef.current[i] = el)}
                  onEnded={() =>
                    i !== 3
                      ? handleProcess("video-end", i)
                      : handleProcess("video-last")
                  }
                  // onPlay={() =>
                  //   setVideo((prevVideo) => ({ 
                  //     ...prevVideo, 
                  //     isPlaying: true 
                  //   }))
                  // }
                  onPlay={() => {
                    setVideo((prevVideo) => {
                      console.log("prevVideo ", prevVideo);
                      return {
                        ...prevVideo, // spread to get everything in prevVideo
                        isPlaying: true // then set isPlaying value
                      };
                    });
                  }}
                  // This gets triggered once metadata of video has loaded. Once loaded, we get the event and call handleLoadedMetaData and pass index and event.
                  onLoadedMetadata={(e) => handleLoadedMetaData(i, e)}
                >
                  <source src={list.video} type="video/mp4" />
                </video>
              </div>
              
              {/* ---------- TEXT ---------- */}
              <div className="absolute top-12 left-[5%] z-10">
                {list.textLists.map((text, i) => (
                  <p key={i} className="md:text-2xl text-xl font-medium">
                    {text}
                  </p>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="relative flex-center mt-10">
        {/* ---------- PAGINATION DOTS ---------- */}
        <div className="flex-center py-5 px-7 bg-gray-300 backdrop-blur rounded-full">
          {videoRef.current.map((_, i) => (
            <span
              key={i}
              className="mx-2 w-3 h-3 bg-gray-200 rounded-full relative cursor-pointer"
              ref={(el) => (videoDivRef.current[i] = el)}
            >
              <span
                className="absolute h-full w-full rounded-full"
                ref={(el) => (videoSpanRef.current[i] = el)}
              />
            </span>
          ))}
        </div>

        {/* ---------- PLAY / PAUSE / RESET ---------- */}
        <button className="control-btn">
          <img
            src={isLastVideo ? replayImg : !isPlaying ? playImg : pauseImg}
            alt={isLastVideo ? "replay" : !isPlaying ? "play" : "pause"}
            onClick={
              isLastVideo
                ? () => handleProcess("video-reset")
                : !isPlaying
                  ? () => handleProcess("play")
                  : () => handleProcess("pause")
            }
          />
        </button>
      </div>
    </>
  );
};

export default VideoCarousel;
