export class CreateVideoDto {
  title: string;
  description: string;
  hasTranscript: boolean;
  sourceLanguageCode: string;
  createdAt: number;
}
