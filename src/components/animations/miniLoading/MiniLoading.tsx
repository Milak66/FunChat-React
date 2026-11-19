import React from "react";
import "./miniLoading.css";

interface MiniLoadingProps {}

const MiniLoading: React.FC<MiniLoadingProps> = (): React.JSX.Element => {
  return (
    <div className="miniLoading" role="status" aria-label="Loading">
      <span className="loadingCircle loadingCircle1"></span>
      <span className="loadingCircle loadingCircle2"></span>
    </div>
  );
};

export default MiniLoading;