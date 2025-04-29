import {
  unfilterAverage,
  unfilterNone,
  unfilterPaeth,
  unfilterSub,
  unfilterUp,
} from './unfilter';

export function applyUnfilter(
  filterType: number,
  currentLine: Uint8Array,
  newLine: Uint8Array,
  prevLine: Uint8Array,
  passLineBytes: number,
  bytesPerPixel: number,
) {
  switch (filterType) {
    case 0:
      unfilterNone(currentLine, newLine, passLineBytes);
      break;
    case 1:
      unfilterSub(currentLine, newLine, passLineBytes, bytesPerPixel);
      break;
    case 2:
      unfilterUp(currentLine, newLine, prevLine, passLineBytes);
      break;
    case 3:
      unfilterAverage(
        currentLine,
        newLine,
        prevLine,
        passLineBytes,
        bytesPerPixel,
      );
      break;
    case 4:
      unfilterPaeth(
        currentLine,
        newLine,
        prevLine,
        passLineBytes,
        bytesPerPixel,
      );
      break;
    default:
      throw new Error(`Unsupported filter: ${filterType}`);
  }
}
