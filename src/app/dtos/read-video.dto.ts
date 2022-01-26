export class ReadVideoDto {
  videoId: string;
  title: string;
  userName: string;
  description: string;
  hasTranscript: boolean;
  sourceTranscriptURL: string;
  sourceLanguageCode: string;
  sourceFileURL: string;
  languages: ILanguage[];
  createdAt: number;
  isGenerating = false;
}

export interface ILanguage {
  language: string;
  srtURL: string;
  vttURL: string;
}
