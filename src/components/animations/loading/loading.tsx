import React, { useEffect, useRef, useState } from "react";
import "./loading.css";
import { useSelector } from "react-redux";
import { RootState } from "../../store/store";
import logo from "../../../assets/logo.jpg";

interface LoadingProps {}

const Loading: React.FC<LoadingProps> = (): React.JSX.Element => {
  const texts = useSelector((state: RootState) => state.reduser.texts);
  const loadingRef = useRef<HTMLImageElement>(null);
  const [dots, setDots] = useState<number>(1);

  // logo: spin + bounce
  useEffect(() => {
    const loadingElement = loadingRef.current;
    if (!loadingElement) return;

    let pos = 1;
    let posAround = 1;
    let directionUp = true;
    let animationFrameId: number;

    function loadingAnimation() {
      if (directionUp) {
        if (pos < 100) {
          pos += 2;
        } else {
          directionUp = false;
          pos -= 2;
        }
      } else {
        if (pos > 1) {
          pos -= 2;
        } else {
          directionUp = true;
          pos += 2;
        }
      }

      posAround = (posAround + 3) % 360;

      if (loadingElement) {
        loadingElement.style.transform = `rotate(${posAround}deg)`;
        loadingElement.style.bottom = `${pos}px`;
      }

      animationFrameId = requestAnimationFrame(loadingAnimation);
    }

    animationFrameId = requestAnimationFrame(loadingAnimation);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  // text: 1 → 2 → 3 dots, then back to 1
  useEffect(() => {
    const intervalId = setInterval(() => {
      setDots((d) => (d % 3) + 1);
    }, 400);

    return () => {
      clearInterval(intervalId);
    };
  }, []);

  // remove dots already in the translation ("Загрузка...") so they don't double up
  const loadingWord = (texts.loadingText ?? "").replace(/[.…]+$/, "");

  return (
    <div className="loading">
      <img ref={loadingRef} className="loadingLogo" src={logo} alt="FunChat" />
      <div className="loadingText">
        {loadingWord}
        <span className="loadingDots">
          {[1, 2, 3].map((i) => (
            <span key={i} style={{ visibility: i <= dots ? "visible" : "hidden" }}>
              .
            </span>
          ))}
        </span>
      </div>
    </div>
  );
};

export default Loading;