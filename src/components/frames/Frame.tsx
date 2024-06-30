"use client";

import {
    FrameUI
} from "@frames.js/render";
import { FarcasterFrameContext, FarcasterSigner, signFrameAction } from '@frames.js/render/farcaster';
import { useFrame } from "@frames.js/render/use-frame";
import { useAuth } from "@lib/context/auth-context";
import { Frame as FrameType } from "frames.js";
import { useEffect, useState } from "react";
import { useAccount } from "wagmi";

type FrameProps = {
    url: string
    frame: FrameType
    frameContext: FarcasterFrameContext
}

export function Frame({ frame, frameContext, url }: FrameProps) {
    const { user } = useAuth()
    const { address: connectedAddress } = useAccount()
    const [farcasterSigner, setFarcasterSigner] = useState<FarcasterSigner | undefined>(undefined)

    useEffect(() => {
        if (user?.keyPair) {
            setFarcasterSigner({
                fid: parseInt(user.id),
                privateKey: `0x${user.keyPair.privateKey}`,
                status: 'approved',
                publicKey: `0x${user.keyPair.publicKey}`
            })
        }
    }, [user])

    const frameState = useFrame({
        // replace with your frame url
        homeframeUrl: url,
        // corresponds to the name of the route for POST in step 3
        frameActionProxy: "/frames",
        connectedAddress,
        // corresponds to the name of the route for GET in step 3
        frameGetProxy: "/frames",
        frameContext,
        // map to your identity if you have one
        signerState: {
            hasSigner: farcasterSigner !== undefined,
            signer: farcasterSigner,
            onSignerlessFramePress: () => {
                // Only run if `hasSigner` is set to `false`
                // This is a good place to throw an error or prompt the user to login
                alert("A frame button was pressed without a signer. Perhaps you want to prompt a login");
            },
            signFrameAction: signFrameAction,
        },
    });

    return (
        <div className="w-[400px] rounded-2xl overflow-hidden">
            <FrameUI frameState={frameState} theme={{
                bg: 'white',
                buttonRadius: '12',
            }} FrameImage={(props) => (<img {...props}></img>)} />
        </div>
    );

}