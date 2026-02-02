import React from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import './LoadingAnimation.css';

const LoadingAnimation = ({ size = 200 }) => {
    return (
        <div className="loading-animation-container">
            <DotLottieReact
                src="https://lottie.host/897a2bc8-dc6b-481d-b7b3-f1728677a47d/giR3l29pyS.lottie"
                loop
                autoplay
                style={{ width: size, height: size }}
            />
        </div>
    );
};

export default LoadingAnimation;
