import { createSignal } from "solid-js";
import styles from "./App.module.css";


export default (() => {
  return <AudioRecorder/>;
});


export function AudioRecorder() {
  const recorder = new Record();

  const rec = () => recorder.isRecording();

  return <>
    <div class={ styles.container }>
      <button onClick={ () => !rec() ? recorder.start() : recorder.stop() }
              class={ styles.button }
              classList={ { [styles.buttonRecording]: rec() } }>
        {
          rec() ? "Stop Recording" : "Start Recording"
        }
      </button>

      {
          recorder.getAudioUrl() != null && <div class={ styles.audioContainer }>
          <audio src={ recorder.getAudioUrl() } controls autoplay/>
        </div>
      }
    </div>
  </>;
}


class Record {
  private _audioUrl: () => string | undefined;
  private _setAudioUrl: (url: string | undefined) => void;
  private _recording: () => boolean;
  private _setRecording: (value: boolean) => void;
  private recorder: MediaRecorder | undefined;


  constructor() {
    [ this._recording, this._setRecording ] = createSignal(false);
    [ this._audioUrl, this._setAudioUrl ] = createSignal();
  }


  isRecording() {
    return this._recording();
  }


  getAudioUrl() {
    return this._audioUrl();
  }


  async start() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
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
