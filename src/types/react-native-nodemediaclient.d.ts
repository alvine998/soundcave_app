declare module 'react-native-nodemediaclient' {
  import React from 'react';
  import { ViewStyle } from 'react-native';

  export interface NodePublisherProps {
    style?: ViewStyle;
    url: string;
    audioParam?: {
      codecid: number;
      profile: number;
      samplerate: number;
      channels: number;
      bitrate: number;
    };
    videoParam?: {
      codecid: number;
      profile: number;
      width: number;
      height: number;
      fps: number;
      bitrate: number;
    };
    frontCamera?: boolean;
    videoOrientation?: number;
    onEvent?: (code: number, msg: string) => void;
  }

  export class NodePublisher extends React.Component<NodePublisherProps> {
    static NMC_CODEC_ID_H264: number;
    static NMC_CODEC_ID_H265: number;
    static NMC_CODEC_ID_AAC: number;
    static NMC_PROFILE_AUTO: number;
    static NMC_PROFILE_H264_BASELINE: number;
    static NMC_PROFILE_H264_MAIN: number;
    static NMC_PROFILE_H264_HIGH: number;
    static NMC_PROFILE_H265_MAIN: number;
    static NMC_PROFILE_AAC_LC: number;
    static NMC_PROFILE_AAC_HE: number;
    static NMC_PROFILE_AAC_HE_V2: number;
    static NMC_PROFILE_AAC_LD: number;
    static NMC_PROFILE_AAC_ELD: number;

    start(): void;
    stop(): void;
    startPreview(): void;
    stopPreview(): void;
  }

  export interface NodePlayerProps {
    style?: ViewStyle;
    url: string;
    bufferTime?: number;
    maxBufferTime?: number;
    autoplay?: boolean;
    scaleMode?: number;
    renderType?: "SURFACEVIEW" | "TEXTUREVIEW";
    onEvent?: (code: number, msg: string) => void;
  }

  export class NodePlayer extends React.Component<NodePlayerProps> {
    start(): void;
    stop(): void;
    pause(): void;
  }
}
