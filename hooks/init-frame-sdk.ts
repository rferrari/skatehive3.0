'use client';

import { useEffect } from 'react';
import sdk from '@farcaster/frame-sdk';

const InitFrameSDK = () => {
    useEffect(() => {
        const load = async () => {
            await sdk.actions.ready();
        };

        load();
    }, []);

    return null;
};

export default InitFrameSDK;