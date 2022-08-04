import {Component, OnInit} from "@angular/core";
import {ActivatedRoute, Router} from "@angular/router";
import {AppService} from "../app.service";
import {ReadVideoDto} from "../dtos/read-video.dto";
import {parseSync, formatTimestamp, stringifySync} from 'subtitle';
import {NgxSpinnerService} from "ngx-spinner";
import * as shortid from "shortid";

@Component({
  selector: 'subtitle-editor',
  templateUrl: './subtitle-editor.component.html',
  styleUrls: ['./subtitle-editor.component.scss']
})
export class SubtitleEditorComponent implements OnInit {
  video: ReadVideoDto;
  subtitleNodes: any;
  currentTime = 0;
  options: any;
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private readonly appService: AppService,
    private readonly spinner: NgxSpinnerService,
  ) {
    this.spinner.show();
  }
  ngOnInit() {
    const videoId = this.route.snapshot.params.videoId;
    this.appService.readVideoDto(videoId).then(video => {
      this.options = {
        autoplay: true, fluid: true, sources: [{src: video.sourceFileURL, type: 'video/mp4'}], tracks: [video.languages[0]]
      };
      this.video = video;
      const subtitleUrl = this.video.languages[0].srtURL;
      this.convertSubtitleURLtoList(subtitleUrl).then(nodes => {
        this.subtitleNodes = nodes;
        this.spinner.hide();
      });
    });
  }

  convertSubtitleURLtoList = async (url: string) => {
    const response = await fetch(url);
    const data = await response.blob();
    const filename = url.split("/")[3];
    const file = new File([data], filename!);
    const fileText = await file.text();
    return parseSync(fileText);
  };

  changeTime(time: number) {
    this.currentTime = time;
  }

  formatTimeStamp(time: number): string {
    return formatTimestamp(time, {format: 'WebVTT'});
  }

  timeStampToUTC(timestamp: number): string {
    return (new Date(timestamp)).toUTCString()
  }

  deleteNode(index: number) {
    this.subtitleNodes.splice(index, 1);
  }

  async save() {
    this.spinner.show();
    const editKey = shortid.generate();
    const srt = stringifySync(this.subtitleNodes, {format: 'SRT'});
    const vtt = stringifySync(this.subtitleNodes, {format: 'WebVTT'});
    await this.appService.emptySubtitleDirectory(this.video.videoId);
    const srtURL = await this.appService.uploadSubtitle(this.video.videoId, srt, 'srt', editKey);
    const vttURL = await this.appService.uploadSubtitle(this.video.videoId, vtt, 'vtt', editKey);
    await this.appService.updateVideo(this.video.videoId, {
      languages: [{
        language: this.video.languages[0].language,
        srtURL,
        vttURL,
      }],
      editKey,
      isSubtitleEdit: true,
    });
    this.router.navigateByUrl('/', {skipLocationChange: true}).then(()=> this.router.navigate(['/subtitle-editor', this.video.videoId]));
  }

}
