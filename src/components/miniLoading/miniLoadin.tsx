import React from "react";
import "./miniLoading.css";

const MiniLoading: React.FC = () => {
    return (
        <div className="miniLoading">
            <div className="loadingCircle loadingCircle1"></div>
            <div className="loadingCircle loadingCircle2"></div>
        </div>
    );
};

export default MiniLoading;