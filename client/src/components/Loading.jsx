import React from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

const Loading = () => {
    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            width: '100vw',
            position: 'fixed',
            top: 0,
            left: 0,
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            zIndex: 9999
        }}>
            <div style={{ width: '300px', height: '300px' }}>
                <DotLottieReact
                    src="https://lottie.host/897a2bc8-dc6b-481d-b7b3-f1728677a47d/giR3l29pyS.lottie"
                    loop
                    autoplay
                />
            </div>
        </div>
    );
};

export default Loading;
