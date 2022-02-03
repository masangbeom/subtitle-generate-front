import {Injectable} from "@angular/core";
import {BehaviorSubject} from "rxjs";
import {ReadVideoDto} from "./dtos/read-video.dto";
import {HttpClient} from "@angular/common/http";
import {EnvService} from "./env.service";
import {CreateVideoDto} from "./dtos/create-video.dto";
import {CreateSubtitleDto} from "./dtos/create-subtitle.dto";

@Injectable()
export class AppService {
  public videosBehavior: BehaviorSubject<ReadVideoDto[]> = new BehaviorSubject<ReadVideoDto[]>([]);

  constructor(
    private readonly httpClient: HttpClient,
    private readonly envService: EnvService,
  ) {
  }

  async createVideo(createVideoDto: CreateVideoDto): Promise<ReadVideoDto> {
    return new Promise(resolve => {
      this.httpClient.post(`${this.envService.ApiUrl}videos`, createVideoDto).subscribe((video: ReadVideoDto) => {
        resolve(video);
      });
    });
  }

  async readVideoDto(videoId: string): Promise<ReadVideoDto> {
    return new Promise(resolve => {
      this.httpClient.get(`${this.envService.ApiUrl}videos/${videoId}`).subscribe((video: ReadVideoDto) => {
        resolve(video);
      });
    });
  }

  async readVideoDtos(userName: string): Promise<ReadVideoDto[]> {
    return new Promise((resolve, reject) => {
      this.httpClient.get<ReadVideoDto[]>(`${this.envService.ApiUrl}videos`)
        .subscribe((videos: ReadVideoDto[]) => {
          this.videosBehavior.next(videos
            .sort((x, y) => +new Date(y.createdAt) - +new Date(x.createdAt))
            .filter(video => video.userName === userName)
            .filter(video => !!video.sourceFileURL));
          resolve(videos);
        }, error => {
          reject(error);
        });
    });
  }

  async updateVideo(videoId: string, body: any) {
    return this.httpClient.patch(`${this.envService.ApiUrl}videos/${videoId}`, body).toPromise();
  }

  async deleteVideo(videoId: string) {
    return this.httpClient.delete(`${this.envService.ApiUrl}videos/${videoId}`, {
      responseType: 'text'
    }).toPromise();
  }

  async createSubtitle(createSubtitleDto: CreateSubtitleDto): Promise<any> {
    return this.httpClient.post(`${this.envService.ApiUrl}subtitle`, createSubtitleDto).toPromise();
  }

  async setEnv(body: any): Promise<any> {
    return this.httpClient.post(`${body.ApiUrl}setting`, body, {
      responseType: 'text'
    }).toPromise();
  }
}
