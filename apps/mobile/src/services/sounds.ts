import { Audio } from 'expo-av';

let correctSound: Audio.Sound | null = null;
let wrongSound: Audio.Sound | null = null;

export async function playCorrectSound() {
  try {
    if (correctSound) {
      await correctSound.replayAsync();
    } else {
      const { sound } = await Audio.Sound.createAsync(
        { uri: 'https://cdn.freesound.org/previews/270/270402_5123851-lq.mp3' },
        { shouldPlay: true, volume: 0.6 }
      );
      correctSound = sound;
    }
  } catch {}
}

export async function playWrongSound() {
  try {
    if (wrongSound) {
      await wrongSound.replayAsync();
    } else {
      const { sound } = await Audio.Sound.createAsync(
        { uri: 'https://cdn.freesound.org/previews/331/331912_3248244-lq.mp3' },
        { shouldPlay: true, volume: 0.5 }
      );
      wrongSound = sound;
    }
  } catch {}
}
