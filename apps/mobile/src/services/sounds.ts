import { createAudioPlayer } from 'expo-audio';

let correctPlayer: ReturnType<typeof createAudioPlayer> | null = null;
let wrongPlayer: ReturnType<typeof createAudioPlayer> | null = null;

export async function playCorrectSound() {
  try {
    if (!correctPlayer) {
      correctPlayer = createAudioPlayer({ uri: 'https://cdn.freesound.org/previews/270/270402_5123851-lq.mp3' });
    }
    correctPlayer.volume = 0.6;
    correctPlayer.seekTo(0);
    correctPlayer.play();
  } catch {}
}

export async function playWrongSound() {
  try {
    if (!wrongPlayer) {
      wrongPlayer = createAudioPlayer({ uri: 'https://cdn.freesound.org/previews/331/331912_3248244-lq.mp3' });
    }
    wrongPlayer.volume = 0.5;
    wrongPlayer.seekTo(0);
    wrongPlayer.play();
  } catch {}
}
