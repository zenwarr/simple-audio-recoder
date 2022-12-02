import { createSignal, For, onMount } from "solid-js";
import styles from "./App.module.css";


export default (() => {
  return <AudioRecorder/>;
});


export function AudioRecorder() {
  const recorder = new Record();

  const rec = () => recorder.isRecording();

  onMount(() => recorder.loadDevices());

  return <>
    <div class={ styles.container }>
      <select class={ styles.select } value={ recorder.getSelectedDevice()?.deviceId }
              onChange={ e => recorder.selectDevice(e.currentTarget.value) }
              disabled={ recorder.isRecording() }>
        <For<MediaDeviceInfo> each={ recorder.getDevices() }>
          {
            (d: MediaDeviceInfo) => <option value={ d.deviceId }>{ d.label }</option>
          }
        </For>
      </select>

      <div class={ styles.audioContainer }>
        {
            recorder.getAudioUrl() != null && <audio src={ recorder.getAudioUrl() } controls autoplay/>
        }
      </div>

      <button onClick={ () => !rec() ? recorder.start() : recorder.stop() }
              class={ styles.button }
              classList={ { [styles.buttonRecording]: rec() } }>
        {
          rec() ? "Stop Recording" : "Start Recording"
        }
      </button>
    </div>
  </>;
}


class Record {
  private _audioUrl: () => string | undefined;
  private _setAudioUrl: (url: string | undefined) => void;
  private _recording: () => boolean;
  private _setRecording: (value: boolean) => void;
  private _devices: () => MediaDeviceInfo[];
  private _setDevices: (d: MediaDeviceInfo[]) => void;
  private _selectedDevice: () => MediaDeviceInfo | undefined;
  private _setSelectedDevice: (d: MediaDeviceInfo | undefined) => void;
  private recorder: MediaRecorder | undefined;


  constructor() {
    [ this._recording, this._setRecording ] = createSignal(false);
    [ this._audioUrl, this._setAudioUrl ] = createSignal();
    [ this._devices, this._setDevices ] = createSignal([]);
    [ this._selectedDevice, this._setSelectedDevice ] = createSignal(undefined);
  }


  async loadDevices() {
    this._setDevices((await navigator.mediaDevices.enumerateDevices()).filter(d => d.kind === "audioinput"));
  }


  getDevices() {
    return this._devices();
  }


  isRecording() {
    return this._recording();
  }


  getAudioUrl() {
    return this._audioUrl();
  }


  getSelectedDevice() {
    return this._selectedDevice();
  }


  selectDevice(deviceId: string) {
    this._setSelectedDevice(this._devices().find(d => d.deviceId === deviceId));
  }


  async start() {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        autoGainControl: false,
        echoCancellation: false,
        noiseSuppression: false,
        deviceId: this._selectedDevice()?.deviceId || "default"
      }
    });
    this.recorder = new MediaRecorder(stream);
    this.recorder.start();
    this._setRecording(true);

    const chunks = [];

    this.recorder.addEventListener("dataavailable", event => {
      chunks.push(event.data);
    });

    this.recorder.addEventListener("stop", () => {
      this._setAudioUrl(URL.createObjectURL(new Blob(chunks)));
      this._setRecording(false);
    });
  }


  async stop() {
    this.recorder?.stop();
  }
}
