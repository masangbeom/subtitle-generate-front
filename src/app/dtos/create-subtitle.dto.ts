export class CreateSubtitleDto {
  videoId: string;
  sourceLanguageCode: string;
  targetLanguage: string;
  hasTranscript: boolean;
  sourceTranscriptURL: string;
}
