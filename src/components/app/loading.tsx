import React, {useEffect, useRef} from "react";
import "./app.css";
import { useSelector } from "react-redux";
import { RootState } from "../store/store";
import logo from "../../assets/logo.jpg";

interface LoadingProps {};

const Loading: React.FC<LoadingProps> = (): React.JSX.Element => {

  const texts = useSelector(
    (state: RootState) => state.reduser.texts
  );

    const loadingRef = useRef<HTMLImageElement>(null);
    let pos = 1;
    let posAround = 1;
    let directionUp = true;
  
    useEffect(() => {
      const loadingElement = loadingRef.current;
  
      if (!loadingElement) return;
  
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
        posAround += 3;
        loadingElement!.style.transform = `rotate(${posAround}deg)`;
        loadingElement!.style.bottom = pos + 'px';
  
        requestAnimationFrame(loadingAnimation);
      }
  
      loadingAnimation();
  
      return () => {
      };
    }, []);

    return (
        <div className="loading">
            <img ref={loadingRef} className="loadingLogo" src={logo} alt="" />
            <div className="loadingText">{texts.loadingText}</div>
        </div>
    )
}

export default Loading;